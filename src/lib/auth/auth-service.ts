/**
 * Auth service — login / logout against the Cascade Dashboard API.
 *
 * Login and logout are plain `fetch` calls, **not** tRPC (`ai/RULES.md §4`):
 * login has no cookie yet, and logout must send the current cookie *then* clear
 * local state. The current-user query (`auth.me`) is the tRPC call and lives in
 * the {@link AuthProvider} bootstrap.
 *
 * The server reads the user **only** from the session cookie — there is no
 * `Authorization: Bearer` path. After a successful login we hand the response to
 * {@link captureFromResponse} so the `Set-Cookie` is persisted and re-sent on
 * every subsequent request.
 */
import { API_URL } from '../api';

import { captureFromResponse, clearCookies, getCookieHeaderSync } from './cookie-jar';

/**
 * Shape returned by `POST /api/auth/login`. Kept intentionally narrow; richer
 * user context (effective org, available orgs) comes from the tRPC `auth.me`
 * query once a session exists.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

/**
 * Typed error for auth failures so callers can distinguish a known
 * server-reported message (bad credentials, etc.) from an unexpected fault.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Best-effort extraction of a server `{ error }` message from a failed response. */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Non-JSON or empty body — fall through to the generic message.
  }
  return fallback;
}

/**
 * Authenticate with email + password. On success the server sets the session
 * cookie (captured here) and returns the user. Throws {@link AuthError} on a
 * non-ok response.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new AuthError(await readErrorMessage(response, 'Invalid email or password'));
  }

  const user = (await response.json()) as AuthUser;
  // Capture the Set-Cookie before returning so the next request is authed.
  await captureFromResponse(response);
  return user;
}

/**
 * End the session. Sends the current cookie so the server can invalidate it,
 * then **always** clears local cookies — even if the network call fails — so the
 * user is never trapped in a signed-in-but-offline state.
 */
export async function logout(): Promise<void> {
  try {
    const cookie = getCookieHeaderSync();
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: cookie ? { Cookie: cookie } : undefined,
    });
  } catch {
    // Ignore network failures — the server expires the session on its own
    // timeline; what matters is clearing local state below.
  } finally {
    await clearCookies();
  }
}
