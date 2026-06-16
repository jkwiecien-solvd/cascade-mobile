/**
 * useIsSuperadmin — a tiny auth selector centralising the "is this user a
 * platform superadmin?" check on `useAuth().user.role`.
 *
 * ## Why this is its own hook
 * The navigation IA gates the **Global** tab (and its route guard) on the
 * user's *account role* being `'superadmin'`. That is **deliberately distinct**
 * from `useOrg().isSuperadmin`, which is derived from `availableOrgs.length > 0`
 * (i.e. "can switch orgs"). A superadmin with access to a single org is still a
 * superadmin — they get the Global tab — but, having nothing to switch between,
 * they see no org switcher. Pinning both consumers (the tab bar and the Global
 * stack guard) to this one selector keeps that contract in one place.
 *
 * Returns `false` while bootstrapping / unauthenticated (no user yet), so the
 * Global affordances stay hidden until the session is known.
 */
import { useAuth } from './auth-provider';

/** True when the signed-in user's account role is `superadmin`. */
export function useIsSuperadmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'superadmin';
}
