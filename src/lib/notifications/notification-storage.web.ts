/**
 * Notification-preference persistence (web) — same signatures as
 * `notification-storage.ts`, backed by `localStorage` because
 * `expo-secure-store` is native-only.
 *
 * Mirrors `src/lib/org-storage.web.ts`: guards `window` for static prerender
 * (`app.json` sets `web.output: "static"`), and degrades to the default value
 * when no DOM is available.
 */

import type { NotificationPrefs } from './notification-storage';

export type { NotificationPrefs, NotificationEventPrefs } from './notification-storage';
export { DEFAULT_NOTIFICATION_PREFS } from './notification-storage';

/** Storage key holding the notification preferences JSON. */
const PREFS_KEY = 'cascade.notificationPrefs';

/** True only in a real browser context (not SSR / static prerender). */
function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  events: { completed: false, failed: false, needsReview: false },
};

/** Read persisted notification preferences, or the default when none stored / no DOM. */
export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  if (!hasLocalStorage()) {
    return { ...DEFAULT_PREFS, events: { ...DEFAULT_PREFS.events } };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      return JSON.parse(raw) as NotificationPrefs;
    }
  } catch {
    // Corrupt — fall through to default.
  }
  return { ...DEFAULT_PREFS, events: { ...DEFAULT_PREFS.events } };
}

/** Persist notification preferences (no-op without a DOM). */
export async function setNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Remove persisted notification preferences (no-op without a DOM). */
export async function clearNotificationPrefs(): Promise<void> {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(PREFS_KEY);
}
