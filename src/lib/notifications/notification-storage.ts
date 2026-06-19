/**
 * Notification-preference persistence (native) — a thin typed wrapper over
 * `expo-secure-store` for push-notification opt-in and event preferences.
 *
 * Mirrors `src/lib/org-storage.ts` (one key, small typed payload, `.web.ts`
 * sibling for web). The shape is kept flat and JSON-serializable so it
 * round-trips cleanly through SecureStore's string-only values.
 *
 * SDK 56: `SecureStore.getItemAsync/setItemAsync/deleteItemAsync` verified
 * against https://docs.expo.dev/versions/v56.0.0/sdk/securestore/.
 */
import * as SecureStore from 'expo-secure-store';

/** Secure-store key holding the notification preferences JSON. */
const PREFS_KEY = 'cascade.notificationPrefs';

/** Per-event-type toggles (all default disabled). */
export type NotificationEventPrefs = {
  completed: boolean;
  failed: boolean;
  needsReview: boolean;
};

/** Full notification preferences shape. */
export type NotificationPrefs = {
  /** Master switch — gates the permission prompt and token registration. */
  enabled: boolean;
  /** Per-event-type toggles, meaningful only when `enabled` is true. */
  events: NotificationEventPrefs;
};

/** Default preferences: disabled, all events off. */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  events: { completed: false, failed: false, needsReview: false },
};

/** Read persisted notification preferences, or the default when none stored. */
export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (raw) {
      return JSON.parse(raw) as NotificationPrefs;
    }
  } catch {
    // Corrupt / unreadable — fall through to default.
  }
  return { ...DEFAULT_NOTIFICATION_PREFS, events: { ...DEFAULT_NOTIFICATION_PREFS.events } };
}

/** Persist notification preferences. */
export async function setNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
}

/** Remove persisted notification preferences (e.g. on sign-out). */
export async function clearNotificationPrefs(): Promise<void> {
  await SecureStore.deleteItemAsync(PREFS_KEY);
}
