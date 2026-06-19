/**
 * Notifications service — web no-op stubs.
 *
 * Web remote push is out of scope. These stubs keep the static web build and
 * Settings screen working without crashing. Mirrors the `.web.ts` platform-split
 * convention used by `cookie-jar.web.ts` and `org-storage.web.ts`.
 */

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

/** Minimal subscription shape matching `EventSubscription` from expo-modules-core. */
type Removable = { remove: () => void };

export type Notification = {
  request: {
    content: {
      data: Record<string, unknown>;
    };
  };
};

export type NotificationResponse = {
  notification: Notification;
};

/** No-op on web. */
export function configureNotificationHandler(): void {
  // Web: no push notification handler needed.
}

/** Always returns `null` on web (push not supported). */
export async function requestPermissionAndGetToken(): Promise<string | null> {
  return null;
}

/** Always returns `'denied'` on web (push not supported). */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  return 'denied';
}

/** No-op listener — returns a remove-able subscription stub. */
export function addNotificationReceivedListener(
  _listener: (notification: Notification) => void,
): Removable {
  return { remove: () => {} };
}

/** No-op listener — returns a remove-able subscription stub. */
export function addNotificationResponseReceivedListener(
  _listener: (response: NotificationResponse) => void,
): Removable {
  return { remove: () => {} };
}

/** No-op listener — returns a remove-able subscription stub. */
export function addPushTokenListener(
  _listener: (token: { data: string }) => void,
): Removable {
  return { remove: () => {} };
}

/** Always returns `null` on web. */
export async function getLastNotificationResponseAsync(): Promise<NotificationResponse | null> {
  return null;
}
