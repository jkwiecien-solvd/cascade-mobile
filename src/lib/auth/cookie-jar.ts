/**
 * Cookie jar for the Cascade session cookie.
 *
 * ## Why this exists
 * React Native's `fetch` does **not** maintain a cookie jar across requests the
 * way a browser does, but the Cascade Dashboard API authenticates **purely**
 * from the session cookie (`ai/RULES.md §4`). This module is the single place
 * that talks to `@preeternal/react-native-cookie-manager` (a New-Architecture /
 * TurboModule drop-in for `@react-native-cookies/cookies`; platform behaviour
 * differs: iOS `HTTPCookieStorage`, Android OkHttp jar, web `document.cookie`)
 * and keeps
 * the captured cookie available to the synchronous tRPC `headers()` callback.
 *
 * ## How it works
 * 1. After login, {@link captureFromResponse} ingests the raw `Set-Cookie`
 *    header via `CookieManager.setFromResponse`, then refreshes the in-memory
 *    cache and mirrors the serialized `Cookie:` header into `expo-secure-store`.
 * 2. {@link restoreCookies} (run once at bootstrap) re-hydrates the in-memory
 *    cache from `expo-secure-store` so the very first protected request after a
 *    cold start carries the cookie even before the native jar is queried.
 * 3. {@link getCookieHeaderSync} is a top-level function returning the
 *    module-scoped cache — it is registered with `setCookieGetter` so the
 *    synchronous `httpBatchLink.headers()` callback can attach `Cookie:`.
 *
 * ## Constraints (verified against package + SDK 56 docs)
 * - **Never filter by cookie name.** In dev the cookie is
 *   `cascade_session_<NODE_ENV>` (e.g. `cascade_session_development`); in prod
 *   `cascade_session`. {@link refreshCache} enumerates *every* cookie pinned to
 *   the API origin and serializes them all (`ai/RULES.md §4` point 3).
 * - `getCookieHeaderSync` MUST read the module-level cache and be a top-level
 *   function (not an arrow closed over provider scope) — React Compiler is
 *   enabled and may inline a closed-over variable.
 * - `clearCookies` uses `clearAll()` for the host rather than name-by-name, so
 *   rotated/renamed session cookies are always removed on logout.
 */
import CookieManager from '@preeternal/react-native-cookie-manager';
import * as SecureStore from 'expo-secure-store';

import { getApiUrl } from '../api';

/**
 * Secure-store key holding the serialized `Cookie:` header (e.g. `"a=1; b=2"`).
 * Survives cold starts where the native cookie jar can be evicted.
 */
const SECURE_STORE_KEY = 'cascade.cookieHeader';

/**
 * Module-scoped in-memory cache of the serialized `Cookie:` header. `null` when
 * no session cookie has been captured. Read synchronously by tRPC.
 */
let cookieHeaderCache: string | null = null;

/**
 * Serialize a `CookieManager.get` result into a single `Cookie:` header value.
 * Returns `null` when there are no cookies for the origin.
 */
function serializeCookies(cookies: Record<string, { name: string; value: string }>): string | null {
  const pairs = Object.values(cookies).map((cookie) => `${cookie.name}=${cookie.value}`);
  return pairs.length > 0 ? pairs.join('; ') : null;
}

/**
 * Re-read every cookie the native jar holds for the API origin, serialize them
 * (no name filtering), and update both the in-memory cache and secure-store.
 */
async function refreshCache(): Promise<void> {
  const cookies = await CookieManager.get(getApiUrl());
  const header = serializeCookies(cookies);
  cookieHeaderCache = header;
  if (header) {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, header);
  } else {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  }
}

/**
 * Capture the `Set-Cookie` returned by `POST /api/auth/login` (or any response
 * that rotates the session). No-op when the response carries no `Set-Cookie`.
 */
export async function captureFromResponse(response: Response): Promise<void> {
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    await CookieManager.setFromResponse(getApiUrl(), setCookie);
  }
  await refreshCache();
}

/**
 * Hydrate the in-memory cache from secure-store on app launch. Falls back to the
 * native jar via {@link refreshCache} so both layers agree before the first
 * protected request fires. Run once during auth bootstrap.
 */
export async function restoreCookies(): Promise<void> {
  const persisted = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  if (persisted) {
    cookieHeaderCache = persisted;
  }
  // Reconcile with the native jar (it may hold a fresher/rotated value, or be
  // empty after eviction in which case the persisted value above still seeds
  // the cache for the first request).
  const cookies = await CookieManager.get(getApiUrl());
  const header = serializeCookies(cookies);
  if (header) {
    cookieHeaderCache = header;
    await SecureStore.setItemAsync(SECURE_STORE_KEY, header);
  }
}

/**
 * Clear every cookie for the host (logout / expired session) and wipe the
 * persisted mirror + in-memory cache. Uses `clearAll()` so rotated or renamed
 * session cookies are always removed.
 */
export async function clearCookies(): Promise<void> {
  await CookieManager.clearAll();
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  cookieHeaderCache = null;
}

/**
 * Synchronous accessor for the serialized `Cookie:` header, or `null` when no
 * session cookie has been captured. Registered with `setCookieGetter` so the
 * synchronous tRPC `headers()` callback can attach it.
 *
 * Must stay a top-level function reading the module-scoped cache (React
 * Compiler safety — see file header).
 */
export function getCookieHeaderSync(): string | null {
  return cookieHeaderCache;
}
