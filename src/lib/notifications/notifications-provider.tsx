/**
 * NotificationsProvider + useNotifications — the app's push-notification state
 * machine, mirroring AuthProvider / OrgProvider.
 *
 * ## Responsibilities
 * 1. Hydrate persisted notification preferences on mount.
 * 2. Expose `setEnabled` / `setEventPref` for the Settings toggle UI.
 * 3. On enable → request permission → get token → register with backend.
 * 4. On disable → unregister token from backend.
 * 5. Silent re-register when returning user (prefs.enabled + permission granted).
 * 6. Token refresh listener → re-register.
 * 7. Sign-out cleanup → unregister token.
 * 8. Notification-tap deep-linking → `router.push('/runs/[runId]')`.
 * 9. Foreground arrival → invalidate runs queries.
 *
 * ## Provider placement
 * Mount inside `<OrgProvider>` in `_layout.tsx` — it reads auth/org state and
 * lives within the navigation tree (deep-links need the router).
 *
 * ## React Compiler safety
 * All external mutations (token ref, listeners) happen in effects/handlers,
 * never during render.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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

import { useAuth } from '../auth';

import { extractRunId } from './notification-deep-link';
import {
  clearNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPrefs,
  setNotificationPrefs,
  type NotificationEventPrefs,
  type NotificationPrefs,
} from './notification-storage';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  addPushTokenListener,
  configureNotificationHandler,
  getLastNotificationResponseAsync,
  getPermissionStatus,
  requestPermissionAndGetToken,
  type PermissionStatus,
} from './notifications';
import { registerToken, unregisterToken } from './register-token';

export type NotificationsState = {
  /** Current notification preferences (master switch + per-event toggles). */
  prefs: NotificationPrefs;
  /** OS notification permission status. */
  permissionStatus: PermissionStatus;
  /** Enable or disable push notifications (triggers permission prompt on enable). */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Toggle an individual event type preference. */
  setEventPref: (event: keyof NotificationEventPrefs, value: boolean) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

// Configure the foreground handler once at module scope (before any notification
// can arrive). This is safe to call multiple times — it's just a setter.
configureNotificationHandler();

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  // Track the current token so we can unregister on sign-out / disable.
  const tokenRef = useRef<string | null>(null);
  const hydrated = useRef(false);
  const coldStartHandled = useRef(false);

  // ─── Hydrate persisted prefs + permission status on mount ────────────
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    let cancelled = false;
    void (async () => {
      const [stored, status] = await Promise.all([
        getNotificationPrefs(),
        getPermissionStatus(),
      ]);
      if (cancelled) return;
      setPrefs(stored);
      setPermissionStatus(status);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Silent re-register for returning users ──────────────────────────
  // When the user is authenticated, prefs.enabled is true, and permission is
  // already granted, obtain a fresh token and re-register (handles token
  // rotation and returning users after a cold start).
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    if (!prefs.enabled) return;
    if (permissionStatus !== 'granted') return;

    let cancelled = false;
    void (async () => {
      const token = await requestPermissionAndGetToken();
      if (cancelled || !token) return;
      tokenRef.current = token;
      await registerToken(token);
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, prefs.enabled, permissionStatus]);

  // ─── Token refresh listener ──────────────────────────────────────────
  useEffect(() => {
    const subscription = addPushTokenListener((tokenData) => {
      const newToken = tokenData.data;
      tokenRef.current = newToken;
      if (prefs.enabled && authStatus === 'authenticated') {
        void registerToken(newToken);
      }
    });
    return () => subscription.remove();
  }, [prefs.enabled, authStatus]);

  // ─── Sign-out cleanup ────────────────────────────────────────────────
  useEffect(() => {
    if (authStatus !== 'unauthenticated') return;
    let cancelled = false;
    void (async () => {
      if (tokenRef.current) {
        await unregisterToken(tokenRef.current);
        if (!cancelled) tokenRef.current = null;
      }
      // Clear local prefs so a different user signing in doesn't inherit them.
      await clearNotificationPrefs();
      if (!cancelled) {
        setPrefs({ ...DEFAULT_NOTIFICATION_PREFS, events: { ...DEFAULT_NOTIFICATION_PREFS.events } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // ─── Notification-tap deep-linking (foreground / background) ─────────
  useEffect(() => {
    const subscription = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const runId = extractRunId(data);
      if (runId) {
        router.push({ pathname: '/runs/[runId]', params: { runId } });
      }
    });
    return () => subscription.remove();
  }, [router]);

  // ─── Cold-start tap handling ─────────────────────────────────────────
  useEffect(() => {
    if (coldStartHandled.current) return;
    if (authStatus !== 'authenticated') return;
    coldStartHandled.current = true;

    void (async () => {
      const lastResponse = await getLastNotificationResponseAsync();
      if (!lastResponse) return;
      const data = lastResponse.notification.request.content.data as Record<string, unknown>;
      const runId = extractRunId(data);
      if (runId) {
        router.push({ pathname: '/runs/[runId]', params: { runId } });
      }
    })();
  }, [authStatus, router]);

  // ─── Foreground arrival → React Query invalidation ───────────────────
  useEffect(() => {
    const subscription = addNotificationReceivedListener((notification) => {
      // Invalidate the runs feed so the list reflects the new outcome.
      void queryClient.invalidateQueries({ queryKey: ['runs.list'] });

      // If a specific runId is present, also invalidate that run's detail.
      const data = notification.request.content.data as Record<string, unknown>;
      const runId = extractRunId(data);
      if (runId) {
        void queryClient.invalidateQueries({
          queryKey: [['runs', 'getById'], { input: { id: runId }, type: 'query' }],
        });
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  // ─── Public actions ──────────────────────────────────────────────────
  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        // User flipped toggle on → request permission + get token.
        const token = await requestPermissionAndGetToken();
        const newStatus = await getPermissionStatus();
        setPermissionStatus(newStatus);

        if (token) {
          tokenRef.current = token;
          await registerToken(token);
          const updated: NotificationPrefs = { ...prefs, enabled: true };
          setPrefs(updated);
          await setNotificationPrefs(updated);
        } else {
          // Permission denied or unsupported — don't persist enabled.
          const newPerm = await getPermissionStatus();
          setPermissionStatus(newPerm);
        }
      } else {
        // User flipped toggle off → unregister + persist disabled.
        if (tokenRef.current) {
          await unregisterToken(tokenRef.current);
          tokenRef.current = null;
        }
        const updated: NotificationPrefs = { ...prefs, enabled: false };
        setPrefs(updated);
        await setNotificationPrefs(updated);
      }
    },
    [prefs],
  );

  const setEventPref = useCallback(
    async (event: keyof NotificationEventPrefs, value: boolean) => {
      const updated: NotificationPrefs = {
        ...prefs,
        events: { ...prefs.events, [event]: value },
      };
      setPrefs(updated);
      await setNotificationPrefs(updated);
    },
    [prefs],
  );

  const value = useMemo<NotificationsState>(
    () => ({ prefs, permissionStatus, setEnabled, setEventPref }),
    [prefs, permissionStatus, setEnabled, setEventPref],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

/**
 * Access the notification state machine. Throws if used outside
 * {@link NotificationsProvider}.
 */
export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a <NotificationsProvider>');
  }
  return context;
}
