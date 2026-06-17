/**
 * Native bottom tab bar (iOS / Android) — the app's primary IA.
 *
 * Renders three tabs, each backed by its own nested `Stack` (see the
 * `src/app/(tabs)/<name>/_layout.tsx` files): **Runs** (default), **Projects**,
 * and **Settings**.
 *
 * Icons use the SDK 56 `NativeTabs.Trigger.Icon` cross-platform props: `sf`
 * (SF Symbols) on iOS and `md` (Material Symbols) on Android — no PNG assets.
 * Verified against the v56 `expo-router/unstable-native-tabs` types.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      iconColor={{
        default: colors.textSecondary,
        selected: colors.text,
      }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.text },
      }}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="runs">
        <NativeTabs.Trigger.Label>Runs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="format_list_bulleted" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="projects">
        <NativeTabs.Trigger.Label>Projects</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="folder" md="folder" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

