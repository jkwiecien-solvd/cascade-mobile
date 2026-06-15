/**
 * Layout for the top-level `projects/` route group: a nested `Stack` (list →
 * `[projectId]` runs detail) with its own auth-redirect guard.
 *
 * The root `useProtectedRoute` only guards the `(tabs)` group, so a top-level
 * group needs to redirect unauthenticated users itself — mirroring
 * `src/app/(tabs)/_layout.tsx`. Headers are enabled (the default) so the detail
 * screen gets a title + back button; the root Stack hides its own header, so
 * this nested Stack owns the in-group navigation chrome.
 *
 * SDK 56 note: `Stack` is imported from `expo-router/stack` (no longer
 * re-exported from the `expo-router` root entry), matching `src/app/_layout.tsx`.
 */
import { Redirect } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { useAuth } from '@/lib/auth';

export default function ProjectsLayout() {
  const { status } = useAuth();

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
