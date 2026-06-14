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

import { setCookieGetter, trpc } from '../trpc';

import { AuthError, login as loginRequest, logout as logoutRequest, type AuthUser } from './auth-service';
import { clearCookies, getCookieHeaderSync, restoreCookies } from './cookie-jar';

export type AuthStatus = 'bootstrapping' | 'unauthenticated' | 'authenticated';

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

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
      // 1. Wire the synchronous cookie getter into the tRPC client.
      setCookieGetter(getCookieHeaderSync);
      // 2. Hydrate the in-memory cookie cache from secure-store.
      await restoreCookies();
      // 3. Validate the stored session via the protected auth.me query.
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
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
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
