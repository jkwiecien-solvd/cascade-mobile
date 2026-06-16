/**
 * OrgSwitcherHeader — a compact, header-right org switcher for the per-tab
 * stacks. It is the navigation-chrome home for org switching now that the old
 * Home tab (which hosted the inline {@link OrgSwitcher}) is gone.
 *
 * Behaviour mirrors the self-hiding contract of {@link OrgSwitcher}: it renders
 * `null` for members and single-org superadmins (nothing to switch), so it is
 * safe to wire into every stack's `headerRight` unconditionally. For a
 * superadmin with more than one org it renders a small pressable showing the
 * **active org name**; pressing it opens a React Native `<Modal>` that reuses the
 * existing {@link OrgSwitcher} chips. Selecting an org runs `switchOrg`
 * (re-scoping + refetching every query) and closes the sheet.
 *
 * Built entirely from existing themed primitives + RN `Modal` — no new
 * dependency (see `ai/RULES.md §4`).
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrgSwitcher } from '@/components/org-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useOrg } from '@/lib/org-context';

export function OrgSwitcherHeader() {
  const { availableOrgs, isSuperadmin, effectiveOrgId } = useOrg();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  // Nothing to switch: members, and superadmins with a single org. Matches the
  // self-hiding contract of <OrgSwitcher /> so the trigger never renders empty.
  if (!isSuperadmin || availableOrgs.length <= 1) return null;

  const activeOrg = availableOrgs.find((org) => org.id === effectiveOrgId);
  const label = activeOrg?.name ?? 'Organization';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Switch organization"
        onPress={() => setOpen(true)}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.trigger}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.triggerLabel}>
            {label}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Stop presses inside the sheet from closing it. */}
          <Pressable
            style={[styles.sheetWrapper, { paddingBottom: insets.bottom + Spacing.four }]}
            onPress={(event) => event.stopPropagation()}>
            <ThemedView type="backgroundElement" style={styles.sheet}>
              <ThemedText type="smallBold" style={styles.sheetTitle}>
                Switch organization
              </ThemedText>
              <OrgSwitcher onSelect={() => setOpen(false)} />
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * Shared `Stack` screen options that wire {@link OrgSwitcherHeader} into the
 * header-right of every authed tab stack, so org switching is reachable from
 * anywhere in the app. Spread into each tab `_layout.tsx`'s `screenOptions`.
 */
export const stackScreenOptions = {
  headerRight: () => <OrgSwitcherHeader />,
} as const;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  trigger: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    maxWidth: 160,
  },
  triggerLabel: {
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  sheet: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  sheetTitle: {
    textAlign: 'center',
  },
});
