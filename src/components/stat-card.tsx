/**
 * StatCard — a small presentational metric card (label + value).
 *
 * Renders inside a 2-column grid on the {@link ProjectStats} screen.
 * When `value` is `null` / `undefined`, an em-dash `"—"` is displayed so the
 * grid cell never collapses. Purely presentational — no data or formatting
 * logic inside (formatting happens in the parent, matching the
 * `src/components/` convention).
 */
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string | null | undefined;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.value} numberOfLines={1}>
        {value ?? '—'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
});
