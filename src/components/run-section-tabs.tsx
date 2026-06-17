/**
 * RunSectionTabs — a presentational segmented tab strip for the run detail
 * screen sections (Overview / Logs / LLM Calls / Debug).
 *
 * Built from the existing `Pressable` + `ThemedView` + `ThemedText` idiom
 * (mirrors `app-tabs.web.tsx`'s `TabButton` and `filter-chips.tsx`'s `Chip`).
 * Pure RN primitives — no platform split needed, renders on iOS / Android / web.
 *
 * The section model is exported as data so the screen stays declarative:
 * labels + placeholder copy are data-driven.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// ─── Section model ───────────────────────────────────────────────────────────

export type RunSection = 'overview' | 'logs' | 'llm-calls' | 'debug';

export const RUN_SECTIONS: readonly {
  key: RunSection;
  label: string;
  emptyMessage: string;
}[] = [
  { key: 'overview', label: 'Overview', emptyMessage: 'Run overview is coming soon.' },
  { key: 'logs', label: 'Logs', emptyMessage: 'Run logs are coming soon.' },
  { key: 'llm-calls', label: 'LLM Calls', emptyMessage: 'LLM call details are coming soon.' },
  { key: 'debug', label: 'Debug', emptyMessage: 'Debug information is coming soon.' },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function RunSectionTabs({
  active,
  onChange,
}: {
  active: RunSection;
  onChange: (section: RunSection) => void;
}) {
  return (
    <View style={styles.tray} accessibilityRole="tablist">
      <ThemedView type="backgroundElement" style={styles.strip}>
        {RUN_SECTIONS.map((section) => {
          const isActive = section.key === active;
          return (
            <Pressable
              key={section.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={section.label}
              onPress={() => onChange(section.key)}
              style={({ pressed }) => [styles.segment, pressed && styles.pressed]}>
              <ThemedView
                type={isActive ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.segmentInner}>
                <ThemedText
                  type={isActive ? 'smallBold' : 'small'}
                  themeColor={isActive ? 'text' : 'textSecondary'}
                  numberOfLines={1}>
                  {section.label}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  strip: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.one,
  },
  segment: {
    flex: 1,
  },
  segmentInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
