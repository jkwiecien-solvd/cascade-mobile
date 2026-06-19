/**
 * AgentStatsRow — a per-agent-type metric card for the project Stats screen.
 *
 * Purely presentational — formatting happens in the parent (`ProjectStats`),
 * following the same contract as {@link StatCard}: the parent computes and
 * formats; this component simply renders. The layout mirrors the `RunCard`
 * scannable hierarchy: agent label on top, then a `·`-separated meta row
 * of run count, success rate, and average cost.
 */
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type AgentStatsRowProps = {
  label: string;
  runs: string | null;
  successRate: string | null;
  avgCost: string | null;
};

/** A single de-emphasised meta segment (mirrors RunCard's MetaText). */
function MetaText({ text }: { text: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {text}
    </ThemedText>
  );
}

export function AgentStatsRow({ label, runs, successRate, avgCost }: AgentStatsRowProps) {
  // Build the meta row from whichever segments are present.
  const segments: { key: string; node: ReactNode }[] = [];
  if (runs != null) segments.push({ key: 'runs', node: <MetaText text={runs} /> });
  if (successRate != null) segments.push({ key: 'success', node: <MetaText text={`${successRate} success`} /> });
  if (avgCost != null) segments.push({ key: 'cost', node: <MetaText text={`${avgCost} avg`} /> });

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold" numberOfLines={1}>
        {label}
      </ThemedText>
      {segments.length > 0 ? (
        <View style={styles.metaRow}>
          {segments.map((seg, index) => (
            <View key={seg.key} style={styles.metaItem}>
              {index > 0 ? <MetaText text="·" /> : null}
              {seg.node}
            </View>
          ))}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
