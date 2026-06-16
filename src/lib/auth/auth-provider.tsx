/**
 * AuthProvider + useAuth — the app's authentication state machine.
 *
 * Status flow:
 *   bootstrapping → (restore cookies → auth.me) → authenticated | unauthenticated
 *
 * The provider owns the one-shot launch bootstrap that:
 *   1. registers {@link getCookieHeaderSync} with `setCookieGetter` so every
 *      subsequent tRPC request carries the `Cookie:` header,
 *   2. restores the persisted cookie into the in-memory cache, and
 *   3. imperatively fetches `auth.me` to decide whether the stored session is
 *      still valid.
 *
 * Keeping the app in `bootstrapping` until this resolves is what prevents the
 * first protected request from firing with no cookie (a spurious 401) and stops
 * the auth gate from flashing the wrong screen.
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { loadApiUrl, saveApiUrl, isApiUrlConfigured } from '../api';
import { setCookieGetter, trpc } from '../trpc';

import { AuthError, login as loginRequest, logout as logoutRequest, type AuthUser } from './auth-service';
import { clearCookies, getCookieHeaderSync, restoreCookies } from './cookie-jar';

export type AuthStatus = 'bootstrapping' | 'need_connection' | 'unauthenticated' | 'authenticated';

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  connect: (url: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** Helper function to perform a fetch request with a timeout. */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<AuthUser | null>(null);
  // Guard against the bootstrap effect running twice (StrictMode / remounts).
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;

    async function bootstrap() {
      // 1. Load the stored API URL.
      const resolvedUrl = await loadApiUrl();

      // 2. Wire the synchronous cookie getter into the tRPC client.
      setCookieGetter(getCookieHeaderSync);
      // 3. Hydrate the in-memory cookie cache from secure-store.
      await restoreCookies();

      // If the URL has never been custom configured, we always route to welcome screen first
      // so the user can verify/confirm the URL on a fresh install.
      if (!isApiUrlConfigured()) {
        if (cancelled) return;
        setStatus('need_connection');
        return;
      }

      // 4. Test connectivity to the loaded Cascade URL.
      try {
        const response = await fetchWithTimeout(`${resolvedUrl}/health`);
        if (!response.ok) {
          throw new Error(`Health check returned status ${response.status}`);
        }
        const health = await response.json();
        if (health?.status !== 'ok') {
          throw new Error('Invalid health status');
        }
      } catch (err) {
        console.warn('Cascade connection check failed on bootstrap:', err);
        if (cancelled) return;
        setStatus('need_connection');
        return;
      }

      // 5. Validate the stored session via the protected auth.me query.
      try {
        // Treat the me-context as the narrow AuthUser shape for now (the plan
        // keeps this narrow; switch to the inferred richer output — effective
        // org, available orgs — when the org-context card consumes it). The cast
        // is valid whether or not the backend `AppRouter` types resolve in this
        // checkout.
        const me = (await queryClient.fetchQuery({
          ...trpc.auth.me.queryOptions(),
          retry: false,
        })) as AuthUser;
        if (cancelled) return;
        setUser({ id: me.id, email: me.email, name: me.name, role: me.role });
        setStatus('authenticated');
      } catch {
        // No / expired session — clear any stale cookie and land on login.
        await clearCookies();
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const connect = useCallback(
    async (url: string) => {
      // 1. Save the new API URL
      await saveApiUrl(url);

      // 2. Clear out any existing cached query data since the server has changed.
      queryClient.clear();

      // 3. Test connectivity to the new URL
      try {
        const response = await fetchWithTimeout(`${url}/health`);
        if (!response.ok) {
          throw new Error(`Cascade returned status ${response.status}`);
        }
        const data = await response.json();
        if (data?.status !== 'ok') {
          throw new Error('Cascade health status is not ok');
        }
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to connect to Cascade instance');
      }

      // 4. Restore cookies for the new host
      await restoreCookies();

      // 5. Check if the user is already authenticated on this new host
      try {
        const me = (await queryClient.fetchQuery({
          ...trpc.auth.me.queryOptions(),
          retry: false,
        })) as AuthUser;
        setUser({ id: me.id, email: me.email, name: me.name, role: me.role });
        setStatus('authenticated');
      } catch {
        // If not logged in, clear cookies and go to login
        await clearCookies();
        setUser(null);
        setStatus('unauthenticated');
      }
    },
    [queryClient],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      await loginRequest(email, password);
      // Load the full me-context (effective org, etc.) now that we have a cookie.
      const me = (await queryClient.fetchQuery({
        ...trpc.auth.me.queryOptions(),
        retry: false,
      })) as AuthUser;
      setUser({ id: me.id, email: me.email, name: me.name, role: me.role });
      setStatus('authenticated');
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await logoutRequest();
    // Drop all cached protected data so a different user can't see it.
    queryClient.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({ status, user, signIn, signOut, connect }),
    [status, user, signIn, signOut, connect],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the auth state machine. Throws if used outside {@link AuthProvider}.
 */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export { AuthError };
export type { AuthUser };
