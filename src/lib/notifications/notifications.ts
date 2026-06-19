/**
 * Notifications service — permission, token acquisition, channel setup, and
 * foreground handler configuration for push notifications.
 *
 * This is the native implementation. The `.web.ts` sibling exports no-op stubs
 * (web remote push is out of scope; keeps the static web build working).
 *
 * ## SDK 56 notes
 * - `setNotificationHandler` uses `shouldShowBanner` and `shouldShowList`
 *   (replaced `shouldShowAlert` in SDK 53+). Verified against
 *   https://docs.expo.dev/versions/v56.0.0/sdk/notifications/.
 * - `getExpoPushTokenAsync` requires `projectId` (from EAS config).
 * - Android requires an explicit notification channel (API 26+).
 *
 * ## Fail-soft
 * Every public function returns `null` or a safe fallback on failure rather than
 * throwing, so the app runs end-to-end even when push is unsupported (simulator,
 * Expo Go, missing EAS config).
 */
import * as Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Permission status as a simple string union for the Settings UI.
 * `'undetermined'` — never asked; `'granted'`; `'denied'`.
 */
export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

/**
 * Configure the foreground notification handler. Call once at app startup
 * (before any notification can arrive) to define how push notifications are
 * displayed when the app is in the foreground.
 *
 * SDK 56: `shouldShowBanner` + `shouldShowList` replace `shouldShowAlert`.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Read the EAS `projectId` from `app.json` → `extra.eas.projectId` or the
 * newer `easConfig.projectId`. Returns `null` when missing (fail-soft).
 */
function getProjectId(): string | null {
  const fromExtra = Constants.default?.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (fromExtra && fromExtra !== 'REPLACE_WITH_EAS_PROJECT_ID') return fromExtra;
  const fromEas = (Constants.default as Record<string, unknown>)?.easConfig as
    | { projectId?: string }
    | undefined;
  return fromEas?.projectId ?? null;
}

/**
 * Request notification permission and obtain an Expo push token.
 *
 * Returns the token string on success, or `null` when any precondition fails
 * (not a device, permission denied, missing projectId, etc.).
 */
export async function requestPermissionAndGetToken(): Promise<string | null> {
  // Push notifications only work on physical devices.
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications are not supported on simulators/emulators.');
    return null;
  }

  // Check / request permission.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission not granted:', finalStatus);
    return null;
  }

  // Android: create the default notification channel (required API 26+).
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  // Obtain the Expo push token (requires EAS projectId).
  const projectId = getProjectId();
  if (!projectId) {
    console.warn(
      '[notifications] No EAS projectId found. Set extra.eas.projectId in app.json.',
    );
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch (err) {
    console.error('[notifications] Failed to get push token:', err);
    return null;
  }
}

/**
 * Read the current OS notification permission status without triggering a prompt.
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

// Re-export the Notifications module pieces consumed by the provider.
export {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  addPushTokenListener,
  getLastNotificationResponseAsync,
} from 'expo-notifications';
export type { Notification, NotificationResponse } from 'expo-notifications';
