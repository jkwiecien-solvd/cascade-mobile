/**
 * Superadmin org switcher. Renders a row of selectable chips, one per org the
 * user may switch between, highlighting the active org. Pressing an inactive
 * chip calls `switchOrg`, which re-scopes every request and refetches data.
 *
 * Self-hiding: returns `null` for members and for single-org superadmins, so it
 * is safe to mount unconditionally. Built from existing themed primitives
 * (`ThemedView`/`ThemedText`/`Pressable`) — no new UI system — mirroring the
 * `pressed`-opacity idiom used in `explore.tsx`.
 *
 * Placement is provisional (see `src/app/(tabs)/index.tsx`); a proper authed app
 * shell/header can host it once routing matures.
 */
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useOrg } from '@/lib/org-context';

export function OrgSwitcher() {
  const { availableOrgs, isSuperadmin, effectiveOrgId, switchOrg } = useOrg();

  // Nothing to switch: members, and superadmins with a single org.
  if (!isSuperadmin || availableOrgs.length <= 1) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Organization
      </ThemedText>
      <ThemedView style={styles.chips}>
        {availableOrgs.map((org) => {
          const active = org.id === effectiveOrgId;
          return (
            <Pressable
              key={org.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) void switchOrg(org.id);
              }}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView
                type={active ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.chip}>
                <ThemedText type={active ? 'smallBold' : 'small'}>{org.name}</ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
});
