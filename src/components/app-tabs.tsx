/**
 * Native bottom tab bar (iOS / Android) — the app's primary IA.
 *
 * Renders up to four tabs, each backed by its own nested `Stack` (see the
 * `src/app/(tabs)/<name>/_layout.tsx` files): **Runs** (default), **Projects**,
 * **Settings**, and a superadmin-only **Global**.
 *
 * Role gating: the Global trigger is rendered only when {@link useIsSuperadmin}
 * is true, so non-superadmins see exactly three tabs. The selector reads the
 * account `role` (not `useOrg().isSuperadmin`, which tracks org count); the role
 * is stable for the session by the time this mounts (the root gate only renders
 * `(tabs)` once authenticated), so the trigger set never changes mid-session and
 * the navigator is not remounted.
 *
 * Icons use the SDK 56 `NativeTabs.Trigger.Icon` cross-platform props: `sf`
 * (SF Symbols) on iOS and `md` (Material Symbols) on Android — no PNG assets.
 * Verified against the v56 `expo-router/unstable-native-tabs` types.
 */
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useIsSuperadmin } from '@/lib/auth';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const isSuperadmin = useIsSuperadmin();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
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

      {isSuperadmin ? (
        <NativeTabs.Trigger name="global">
          <NativeTabs.Trigger.Label>Global</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="globe" md="public" />
        </NativeTabs.Trigger>
      ) : null}
    </NativeTabs>
  );
}
