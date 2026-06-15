/**
 * Org-selection persistence (native) — a thin typed wrapper over
 * `expo-secure-store` for the superadmin's chosen org id.
 *
 * Kept deliberately small and isolated to the one key so it can later be folded
 * into a broader secure-store layer without conflict. The `.web.ts` sibling
 * backs the same signatures with `localStorage` (SecureStore is native-only).
 *
 * SDK 56: `SecureStore.getItemAsync/setItemAsync/deleteItemAsync` verified
 * against https://docs.expo.dev/versions/v56.0.0/sdk/securestore/.
 */
import * as SecureStore from 'expo-secure-store';

/** Secure-store key holding the superadmin's persisted org selection. */
const ORG_KEY = 'cascade.selectedOrgId';

/** Read the persisted org id, or `null` when none has been stored. */
export async function getStoredOrgId(): Promise<string | null> {
  return SecureStore.getItemAsync(ORG_KEY);
}

/** Persist the chosen org id. */
export async function setStoredOrgId(id: string): Promise<void> {
  await SecureStore.setItemAsync(ORG_KEY, id);
}

/** Remove any persisted org selection (e.g. on logout). */
export async function clearStoredOrgId(): Promise<void> {
  await SecureStore.deleteItemAsync(ORG_KEY);
}
