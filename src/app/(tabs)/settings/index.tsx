/**
 * Settings → General — account info, the active organization, the Cascade
 * instance, push notification preferences, and the relocated sign-out control.
 *
 * Account fields come from `useAuth().user` (name, email, role); the active org
 * name is resolved from `useOrg()` (`availableOrgs` matched against
 * `effectiveOrgId`). The {@link LogoutButton} moves here from the removed Home
 * tab — the component itself is unchanged, just re-mounted in its proper home.
 *
 * The **Notifications** card drives the permission prompt (post-login, never
 * cold launch). The master switch triggers `setEnabled`; per-event sub-toggles
 * appear when enabled. Permission-denied state shows a hint + "Open Settings"
 * affordance. On web the section is hidden (no remote push support).
 */
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoutButton } from '@/components/logout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useNotifications, type NotificationEventPrefs } from '@/lib/notifications';
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

/** A switch row with label, matching the card styling. */
function SwitchRow({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.switchRow}>
      <ThemedText type="smallBold" style={disabled && styles.disabledText}>
        {label}
      </ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Push-notifications section — shown only on native platforms. */
function NotificationsSection() {
  const { prefs, permissionStatus, setEnabled, setEventPref } = useNotifications();

  const isDenied = permissionStatus === 'denied' && !prefs.enabled;

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        Notifications
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        <SwitchRow
          label="Push Notifications"
          value={prefs.enabled}
          onValueChange={(v) => void setEnabled(v)}
        />

        {isDenied ? (
          <View style={styles.hintContainer}>
            <ThemedText type="small" themeColor="textSecondary">
              Notification permission was denied. Enable it in your device settings.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openSettings()}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="linkPrimary">Open Settings</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {prefs.enabled ? (
          <>
            <View style={styles.divider} />
            <ThemedText type="small" themeColor="textSecondary">
              Notify me when a run…
            </ThemedText>
            <SwitchRow
              label="Completed"
              value={prefs.events.completed}
              onValueChange={(v) => void setEventPref('completed' as keyof NotificationEventPrefs, v)}
            />
            <SwitchRow
              label="Failed"
              value={prefs.events.failed}
              onValueChange={(v) => void setEventPref('failed' as keyof NotificationEventPrefs, v)}
            />
            <SwitchRow
              label="Needs Review"
              value={prefs.events.needsReview}
              onValueChange={(v) => void setEventPref('needsReview' as keyof NotificationEventPrefs, v)}
            />
          </>
        ) : null}
      </ThemedView>
    </>
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

  const showNotifications = Platform.OS !== 'web';

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

        {showNotifications ? <NotificationsSection /> : null}

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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  hintContainer: {
    gap: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8888',
  },
  disabledText: {
    opacity: 0.5,
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
