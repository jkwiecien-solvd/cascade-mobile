/**
 * Settings → General — account info, the active organization, a link to Users,
 * and the relocated sign-out control.
 *
 * Account fields come from `useAuth().user` (name, email, role); the active org
 * name is resolved from `useOrg()` (`availableOrgs` matched against
 * `effectiveOrgId`). The {@link LogoutButton} moves here from the removed Home
 * tab — the component itself is unchanged, just re-mounted in its proper home.
 */
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoutButton } from '@/components/logout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useOrg } from '@/lib/org-context';
import { getApiUrl } from '@/lib/api';

/** A labelled value row used for the account fields. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" numberOfLines={1}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { availableOrgs, effectiveOrgId } = useOrg();

  // `availableOrgs` is only populated for superadmins; members can't switch, so
  // we have a name to show only when the active org is in that list. Otherwise
  // fall back to a friendly label rather than leaking the opaque org id.
  const activeOrg = availableOrgs.find((org) => org.id === effectiveOrgId);
  const orgLabel = activeOrg?.name ?? 'Default organization';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <ThemedText type="small" themeColor="textSecondary">
          Account
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <InfoRow label="Name" value={user?.name ?? '—'} />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Role" value={user?.role ?? '—'} />
          <InfoRow label="Organization" value={orgLabel} />
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          General
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/users')}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={styles.linkRow}>
            <ThemedText type="smallBold">Users</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Manage who has access
            </ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await signOut();
            router.push('/welcome');
          }}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={styles.linkRow}>
            <ThemedText type="smallBold">Cascade Instance</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {getApiUrl()} (Change)
            </ThemedText>
          </ThemedView>
        </Pressable>

        <ThemedView style={styles.signOut}>
          <LogoutButton />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  infoRow: {
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  linkRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  signOut: {
    marginTop: Spacing.four,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
