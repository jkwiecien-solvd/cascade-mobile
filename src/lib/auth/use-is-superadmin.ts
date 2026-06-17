/**
 * useIsSuperadmin — a tiny auth selector centralising the "is this user a
 * platform superadmin?" check on `useAuth().user.role`.
 *
 * ## Why this is its own hook
 * The selector checks if the user's *account role* is `'superadmin'`. That is
 * **deliberately distinct** from `useOrg().isSuperadmin`, which is derived from
 * `availableOrgs.length > 0` (i.e. "can switch orgs"). A superadmin with access
 * to a single org is still a superadmin — but, having nothing to switch between,
 * they see no org switcher. Pinning both consumers to this one selector keeps
 * that contract in one place.
 *
 * Returns `false` while bootstrapping / unauthenticated (no user yet).
 */
import { useAuth } from './auth-provider';

/** True when the signed-in user's account role is `superadmin`. */
export function useIsSuperadmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'superadmin';
}
