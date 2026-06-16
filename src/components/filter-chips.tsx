/**
 * FilterChips — a reusable single-select horizontal chip group with a leading
 * "All" chip that clears the selection (sets `null`).
 *
 * Themed from the existing palette (`backgroundSelected` for the active chip —
 * the same token `org-switcher.tsx` uses) and the shared `Pressable` +
 * `pressed`-opacity idiom, so it introduces no new styling system
 * (`ai/RULES.md §2/§3`). Used by the runs filter sheet for the Status, Agent
 * type, and Project dimensions.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type FilterOption = { value: string; label: string };

export function FilterChips({
  label,
  options,
  selected,
  onChange,
}: {
  label?: string;
  options: FilterOption[];
  selected: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <ThemedView style={styles.container}>
      {label ? (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <View style={styles.chips}>
        <Chip label="All" active={selected == null} onPress={() => onChange(null)} />
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={selected === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </ThemedView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={active ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
        <ThemedText type={active ? 'smallBold' : 'small'}>{label}</ThemedText>
      </ThemedView>
    </Pressable>
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
