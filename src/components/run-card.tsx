/**
 * RunCard — one card per run for the cross-project Runs feed.
 *
 * A mobile-native alternative to cascade-web's dense multi-column runs table:
 * the scannable fields sit up top (agent type + status badge), the linkage
 * (project / work item) in the middle, and de-emphasised meta (relative start
 * time · duration · cost · iterations) at the bottom — mirroring the visual
 * hierarchy in the card requirements. Built from the existing themed primitives
 * and the `Pressable` + `pressed`-opacity idiom used by the projects rows.
 *
 * ## Type note
 * `runs.list`'s output is inferred from the backend `AppRouter`, which lives in
 * the sibling `../cascade` repo (absent in this checkout). Rendering reads the
 * fields through {@link RunListItem} — a narrow local view (the same cross-repo
 * narrowing idiom used by `org-context.tsx` / `projects/index.tsx`) — so the
 * card stays typed (no `any`) and tolerates optional/renamed fields the
 * contract may omit.
 */
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { LiveDuration } from '@/components/live-duration';
import { RunStatusBadge } from '@/components/run-status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatAgentType, formatCost, formatDuration, formatRelativeTime } from '@/lib/relative-time';

/** Narrow view of the `runs.list` output fields this card renders. */
export type RunListItem = {
  id: string;
  agentType?: string;
  projectName?: string;
  status?: string;
  startedAt?: string | number | Date;
  durationMs?: number;
  costUsd?: number;
  llmIterations?: number;
  prUrl?: string;
  prNumber?: number;
  workItemTitle?: string;
  workItemUrl?: string;
  orgName?: string;
};

/** True while the run is actively executing (drives the live-ticking duration). */
function isRunning(status: string | undefined): boolean {
  const s = status?.toLowerCase();
  return s === 'running' || s === 'in_progress';
}

/** A single de-emphasised meta segment. */
function MetaText({ text }: { text: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {text}
    </ThemedText>
  );
}

export function RunCard({
  run,
  showOrg,
  onPress,
}: {
  run: RunListItem;
  showOrg: boolean;
  onPress: () => void;
}) {
  const relative = formatRelativeTime(run.startedAt);
  const duration = formatDuration(run.durationMs);
  const cost = formatCost(run.costUsd);
  const running = isRunning(run.status);

  // Build the de-emphasised meta row from whatever fields the contract provides.
  const meta: { key: string; node: ReactNode }[] = [];
  if (relative) meta.push({ key: 'relative', node: <MetaText text={relative} /> });
  if (running && run.startedAt != null) {
    meta.push({ key: 'live', node: <LiveDuration startedAt={run.startedAt} themeColor="textSecondary" /> });
  } else if (duration) {
    meta.push({ key: 'duration', node: <MetaText text={duration} /> });
  }
  if (cost) meta.push({ key: 'cost', node: <MetaText text={cost} /> });
  if (run.llmIterations != null) {
    meta.push({ key: 'iterations', node: <MetaText text={`${run.llmIterations} iter`} /> });
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        {/* Primary: agent type + status badge. */}
        <View style={styles.primaryRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.primaryLabel}>
            {formatAgentType(run.agentType)}
          </ThemedText>
          {run.status ? <RunStatusBadge status={run.status} /> : null}
        </View>

        {/* Secondary: project + (when linked) work item. */}
        {run.projectName ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {run.projectName}
          </ThemedText>
        ) : null}
        {run.workItemTitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {run.workItemTitle}
          </ThemedText>
        ) : null}

        {/* Meta row: relative time · duration · cost · iterations. */}
        {meta.length > 0 ? (
          <View style={styles.metaRow}>
            {meta.map((item, index) => (
              <View key={item.key} style={styles.metaItem}>
                {index > 0 ? <MetaText text="·" /> : null}
                {item.node}
              </View>
            ))}
          </View>
        ) : null}

        {/* Org name — only for superadmins (mirrors web `showOrg`). */}
        {showOrg && run.orgName ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {run.orgName}
          </ThemedText>
        ) : null}
      </Pressable>

      {/* PR affordance — rendered outside the navigation Pressable so tapping
          it opens the in-app browser instead of drilling into the run. */}
      {run.prUrl ? (
        <ExternalLink href={run.prUrl}>
          <ThemedText type="linkPrimary">
            {run.prNumber != null ? `PR #${run.prNumber}` : 'View PR'}
          </ThemedText>
        </ExternalLink>
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
  pressable: {
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  primaryLabel: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
