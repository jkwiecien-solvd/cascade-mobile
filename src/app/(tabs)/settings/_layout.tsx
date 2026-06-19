/**
 * Settings tab layout — a nested `Stack` with the shared org-switcher header
 * control. Like the other tab stacks it carries no auth `Redirect`: the
 * `(tabs)` group is already gated upstream.
 */
import { Stack } from 'expo-router/stack';

import { stackScreenOptions } from '@/components/org-switcher-header';

export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: true, ...stackScreenOptions }} />;
}
