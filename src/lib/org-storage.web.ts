/**
 * Org-selection persistence (web) — same signatures as `org-storage.ts`, backed
 * by `localStorage` because `expo-secure-store` is native-only. Mirrors the web
 * reference client's `org-context.tsx` localStorage approach and the repo's
 * `.web` platform-split convention.
 *
 * `app.json` sets `web.output: "static"`, so this module can be evaluated during
 * static prerender where `window` is undefined — every accessor guards for it
 * and degrades to a no-op / `null`.
 */

/** Storage key holding the superadmin's persisted org selection. */
const ORG_KEY = 'cascade.selectedOrgId';

/** True only in a real browser context (not SSR / static prerender). */
function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Read the persisted org id, or `null` when none has been stored / no DOM. */
export async function getStoredOrgId(): Promise<string | null> {
  if (!hasLocalStorage()) return null;
  return window.localStorage.getItem(ORG_KEY);
}

/** Persist the chosen org id (no-op without a DOM). */
export async function setStoredOrgId(id: string): Promise<void> {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(ORG_KEY, id);
}

/** Remove any persisted org selection (no-op without a DOM). */
export async function clearStoredOrgId(): Promise<void> {
  if (!hasLocalStorage()) return;
  window.localStorage.removeItem(ORG_KEY);
}
