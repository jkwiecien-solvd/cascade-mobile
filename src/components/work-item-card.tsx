/**
 * WorkItemCard — one card per unified work item for the project Work view.
 *
 * A mobile-native adaptation of cascade-web's `project-work-table.tsx` row
 * (`ProjectWorkTable`): instead of a dense multi-column table, each work item is
 * a card with a type chip, the PR / work-item title (stacked with its associated
 * item), a per-agent duration bar, and a run-count · cost meta line.
 *
 * ## Navigation
 * The card body is wrapped in a `Pressable` that drills into an in-app runs
 * screen for the work item / PR (when an `onPress` callback is provided).
 * External links to GitHub / the PM tool remain as separate `ExternalLink`
 * affordances — tapping the `#number`/title link opens the external URL,
 * tapping elsewhere on the card opens the drill-down. This keeps both
 * interactions reachable.
 *
 * ## Type note
 * Fields are read through {@link WorkItem} — a narrow local view of
 * `prs.listUnifiedWithDurations`'s output (same cross-repo narrowing idiom as
 * `RunListItem`). Confirmed against `../cascade/src/db/repositories/
 * prWorkItemsRepository.ts` (`UnifiedWorkItemWithDurations`).
 */
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkItemDurationBar } from '@/components/work-item-duration-bar';
import { Spacing } from '@/constants/theme';
import type { RunSegmentInput } from '@/lib/agent-colors';
import { formatCost } from '@/lib/relative-time';
import { Pressable, StyleSheet, View } from 'react-native';

/** Narrow view of a `prs.listUnifiedWithDurations` item. */
export type WorkItem = {
  id: string;
  type: 'pr' | 'linked' | 'work-item';
  prNumber: number | null;
  prUrl: string | null;
  prTitle: string | null;
  workItemId: string | null;
  workItemUrl: string | null;
  workItemTitle: string | null;
  runCount: number;
  totalCostUsd: string | number | null;
  runs?: RunSegmentInput[];
};

/** PR "#123 · title" or the work-item title, linked to its URL when present. */
function PrimaryTitle({ item }: { item: WorkItem }) {
  if (item.type === 'work-item') {
    if (!item.workItemTitle) {
      return (
        <ThemedText type="smallBold" themeColor="textSecondary">
          No title
        </ThemedText>
      );
    }
    return item.workItemUrl ? (
      <ExternalLink href={item.workItemUrl}>
        <ThemedText type="linkPrimary" numberOfLines={3}>
          {item.workItemTitle}
        </ThemedText>
      </ExternalLink>
    ) : (
      <ThemedText type="smallBold" numberOfLines={3}>
        {item.workItemTitle}
      </ThemedText>
    );
  }

  const label = `#${item.prNumber}${item.prTitle ? ` · ${item.prTitle}` : ''}`;
  return item.prUrl ? (
    <ExternalLink href={item.prUrl}>
      <ThemedText type="linkPrimary" numberOfLines={3}>
        {label}
      </ThemedText>
    </ExternalLink>
  ) : (
    <ThemedText type="smallBold" numberOfLines={3}>
      {label}
    </ThemedText>
  );
}

/** Associated work item (for linked rows) or a "No PR yet" hint (for work items). */
function SecondaryTitle({ item }: { item: WorkItem }) {
  if (item.type === 'work-item') {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No PR yet
      </ThemedText>
    );
  }
  if (item.type !== 'linked' || !item.workItemTitle) return null;

  return item.workItemUrl ? (
    <ExternalLink href={item.workItemUrl}>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
        {item.workItemTitle}
      </ThemedText>
    </ExternalLink>
  ) : (
    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
      {item.workItemTitle}
    </ThemedText>
  );
}

export function WorkItemCard({
  item,
  projectAvgDurationMs,
  onPress,
}: {
  item: WorkItem;
  projectAvgDurationMs: number | null;
  onPress?: () => void;
}) {
  const cost = formatCost(item.totalCostUsd);

  const content = (
    <>
      {/* Title block */}
      <View style={styles.titleBlock}>
        <PrimaryTitle item={item} />
        <SecondaryTitle item={item} />
      </View>

      {/* Duration bar (by agent type) */}
      <WorkItemDurationBar runs={item.runs ?? []} projectAvgDurationMs={projectAvgDurationMs} />

      {/* Meta: run count · cost */}
      <View style={styles.metaRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {item.runCount} {item.runCount === 1 ? 'run' : 'runs'}
        </ThemedText>
        {cost ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              ·
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {cost}
            </ThemedText>
          </>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}>
          {content}
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {content}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  titleBlock: {
    gap: Spacing.half,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
