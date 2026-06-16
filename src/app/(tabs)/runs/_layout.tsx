/**
 * Runs tab layout — a nested `Stack` so the runs feed can push a run-detail
 * screen without disturbing the other tabs' navigation state.
 *
 * No auth `Redirect` here: the whole `(tabs)` group is already gated by the root
 * layout's `useProtectedRoute` + `(tabs)/_layout.tsx`. This layout only owns the
 * in-tab navigation chrome — headers on (so detail screens get a title + back
 * button) plus the shared org-switcher header control.
 *
 * SDK 56 note: `Stack` is imported from `expo-router/stack` (no longer
 * re-exported from the `expo-router` root entry), matching `src/app/_layout.tsx`.
 */
import { Stack } from 'expo-router/stack';

import { stackScreenOptions } from '@/components/org-switcher-header';

export default function RunsLayout() {
  return <Stack screenOptions={{ headerShown: true, ...stackScreenOptions }} />;
}
