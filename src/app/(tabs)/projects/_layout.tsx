/**
 * Projects tab layout — a nested `Stack` (list → detail/sections → section
 * placeholder) with the shared org-switcher header control.
 *
 * Unlike the old top-level `projects/` group, there is no auth `Redirect` here:
 * the whole `(tabs)` group is already gated by the root layout's
 * `useProtectedRoute` + `(tabs)/_layout.tsx`, so this layout only renders the
 * `Stack` and owns the in-tab navigation chrome.
 *
 * SDK 56 note: `Stack` is imported from `expo-router/stack`.
 */
import { Stack } from 'expo-router/stack';

import { stackScreenOptions } from '@/components/org-switcher-header';

export default function ProjectsLayout() {
  return <Stack screenOptions={{ headerShown: true, ...stackScreenOptions }} />;
}
