/**
 * Global tab layout — a nested `Stack` guarded by {@link useIsSuperadmin}.
 *
 * The Global tab is only rendered in the tab bar for superadmins, but this
 * stack guards itself too (defense-in-depth): a non-superadmin who somehow lands
 * on a `global/*` route is redirected to the Runs tab. This mirrors the
 * `Redirect` idiom the old `projects/_layout.tsx` used for its auth gate.
 *
 * Role gating uses `useIsSuperadmin()` (the account `role`), **not**
 * `useOrg().isSuperadmin` (org count) — a superadmin with a single org still
 * gets Global.
 */
import { Redirect } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { stackScreenOptions } from '@/components/org-switcher-header';
import { useIsSuperadmin } from '@/lib/auth';

export default function GlobalLayout() {
  const isSuperadmin = useIsSuperadmin();

  if (!isSuperadmin) {
    return <Redirect href="/runs" />;
  }

  return <Stack screenOptions={{ headerShown: true, ...stackScreenOptions }} />;
}
