/**
 * DurationBarChart — horizontal bars of total work duration by agent type, the
 * mobile port of the web client's `ProjectWorkDurationChart` (`../cascade/web`).
 *
 * Bars are plain themed Views sized proportionally to the longest bar (no SVG
 * needed for a horizontal bar — the pie is where `react-native-svg` earns its
 * place). Rows are pre-sorted by the parent. Purely presentational: the parent
 * (`ProjectStats`) derives values, colors, and formatted labels.
 */
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** One bar: a positive duration `value` (ms), its color, and display copy. */
export type DurationBar = {
  key: string;
  label: string;
  value: number;
  color: string;
  display: string;
};

export function DurationBarChart({ bars }: { bars: DurationBar[] }) {
  const theme = useTheme();
  const max = bars.reduce((m, b) => Math.max(m, b.value), 0);

  return (
    <View style={styles.container}>
      {bars.map((bar) => {
        // Floor at a thin sliver so a non-zero-but-tiny bar stays visible.
        const fraction = max > 0 ? Math.max(bar.value / max, 0.02) : 0;
        return (
          <View key={bar.key} style={styles.row}>
            <View style={styles.labelRow}>
              <ThemedText type="small" numberOfLines={1} style={styles.label}>
                {bar.label}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {bar.display}
              </ThemedText>
            </View>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[
                  styles.fill,
                  { backgroundColor: bar.color, width: `${fraction * 100}%` },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
