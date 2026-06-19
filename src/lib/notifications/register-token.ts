/**
 * Fail-soft backend token-registration client.
 *
 * Mirrors `src/lib/auth/auth-service.ts` — plain `fetch`, not tRPC, because
 * this is an auth-adjacent side effect (like login/logout), not display data.
 * The session cookie is attached via `getCookieHeaderSync()` (the backend
 * authenticates only from the cookie — `ai/RULES.md §4`).
 *
 * ## Proposed contract
 * The endpoint path + payload below are a **proposal** pending backend sign-off
 * (Step 9 / `docs/push-notifications-backend-proposal.md`). A tRPC mutation
 * (`notifications.registerDevice`) is the documented alternative the maintainers
 * may prefer.
 *
 * ## Fail-soft
 * Both `registerToken` and `unregisterToken` wrap in try/catch, log, and
 * swallow errors — tolerating 404 until the backend endpoint exists — so the
 * client spike runs end-to-end without the server.
 */
import { Platform } from 'react-native';

import { getApiUrl } from '../api';
import { getCookieHeaderSync } from '../auth/cookie-jar';

/**
 * Register a push token with the backend.
 *
 * Fails silently (logs + swallows) so the spike runs without the endpoint.
 */
export async function registerToken(token: string): Promise<void> {
  try {
    const cookie = getCookieHeaderSync();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const response = await fetch(`${getApiUrl()}/api/notifications/register-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[notifications] registerToken responded ${response.status} — endpoint may not exist yet.`,
      );
    }
  } catch (err) {
    // Fail soft — the backend endpoint may not exist yet (Phase B).
    console.warn('[notifications] registerToken failed (expected before backend ships):', err);
  }
}

/**
 * Unregister a push token from the backend (e.g. on sign-out or opt-out).
 *
 * Fails silently (logs + swallows) so the spike runs without the endpoint.
 */
export async function unregisterToken(token: string): Promise<void> {
  try {
    const cookie = getCookieHeaderSync();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const response = await fetch(`${getApiUrl()}/api/notifications/unregister-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[notifications] unregisterToken responded ${response.status} — endpoint may not exist yet.`,
      );
    }
  } catch (err) {
    console.warn('[notifications] unregisterToken failed (expected before backend ships):', err);
  }
}
