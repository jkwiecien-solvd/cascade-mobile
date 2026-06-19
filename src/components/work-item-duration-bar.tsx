/**
 * WorkItemDurationBar — compact stacked bar of a work item's run durations by
 * agent type, with the total duration alongside. Mirrors cascade-web's
 * `work-item-duration-bar.tsx`: segments are colored per agent type and the
 * total turns red (outlier) when it exceeds 2× the project average.
 */
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { type RunSegmentInput, buildDurationSegments, useAgentColor } from '@/lib/agent-colors';
import { formatDuration } from '@/lib/relative-time';

const OUTLIER_RED = '#e5484d';

export function WorkItemDurationBar({
  runs,
  projectAvgDurationMs,
}: {
  runs: RunSegmentInput[];
  projectAvgDurationMs: number | null;
}) {
  const colorFn = useAgentColor();
  const segments = buildDurationSegments(runs, colorFn);

  if (segments.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        —
      </ThemedText>
    );
  }

  const totalMs = segments.reduce((sum, s) => sum + s.durationMs, 0);
  const isOutlier = projectAvgDurationMs != null && totalMs > 2 * projectAvgDurationMs;
  const total = formatDuration(totalMs);

  return (
    <View style={styles.row}>
      <View style={[styles.bar, isOutlier && styles.barOutlier]}>
        {segments.map((seg, i) => (
          <View
            key={`${seg.agentType}-${i}`}
            style={{ flexGrow: seg.pct, backgroundColor: seg.color }}
          />
        ))}
      </View>
      {total ? (
        <ThemedText
          type="small"
          themeColor={isOutlier ? undefined : 'textSecondary'}
          style={isOutlier ? styles.outlierText : undefined}
          numberOfLines={1}>
          {total}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    height: 14,
    borderRadius: Spacing.half,
    overflow: 'hidden',
  },
  barOutlier: {
    borderWidth: 1,
    borderColor: OUTLIER_RED,
  },
  outlierText: {
    color: OUTLIER_RED,
    fontWeight: '600',
  },
});
