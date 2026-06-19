/**
 * Project Work — the project's unified Work view: a list of work items (PRs +
 * work items) with per-agent run durations, run counts, and cost. This mirrors
 * cascade-web's project Work page (`projects/$projectId.work.tsx` →
 * `ProjectWorkTable`), NOT the Runs feed — the two are different data sources
 * (`prs.listUnifiedWithDurations` vs `runs.list`).
 *
 * Mobile-native adaptation: the web's dense table becomes a `FlatList` of
 * `WorkItemCard`s, with an agent-color legend as the list header (matching the
 * table's legend) and a "N total" count in the screen header. No status /
 * agent-type filters — the web Work view has none. Pull-to-refresh; no infinite
 * scroll (the endpoint returns the full list, like web).
 *
 * `headerRight` (the org switcher) is inherited from `ProjectsLayout`'s
 * `stackScreenOptions` — this screen doesn't override it.
 */
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkItemCard, type WorkItem } from '@/components/work-item-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAgentColor } from '@/lib/agent-colors';
import { formatAgentType } from '@/lib/relative-time';
import { useProjectWork } from '@/hooks/use-project-work';

export default function ProjectWorkScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const agentColor = useAgentColor();
  const { projectId, label } = useLocalSearchParams<{ projectId: string; label?: string }>();

  const { data, isPending, isError, error, refetch, isRefetching } = useProjectWork(projectId);

  const items = useMemo(() => (data?.items ?? []) as WorkItem[], [data]);
  const projectAvgDurationMs = data?.projectAvgDurationMs ?? null;

  // Unique agent types across all items, for the color legend (mirrors web).
  const agentTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const item of items) {
      for (const run of item.runs ?? []) seen.add(run.agentType);
    }
    return [...seen];
  }, [items]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: label ?? 'Work' }} />

      {isPending ? (
        <Loading message="Loading work…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.three }]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={
            <View style={styles.headerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {items.length} total
              </ThemedText>
              {agentTypes.length > 0 ? (
                <View style={styles.legend}>
                  {agentTypes.map((at) => (
                    <View key={at} style={styles.legendItem}>
                      <View style={[styles.swatch, { backgroundColor: agentColor(at) }]} />
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {formatAgentType(at)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptyState message="No work found for this project." />}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
          )}
          renderItem={({ item }) => (
            <WorkItemCard item={item} projectAvgDurationMs={projectAvgDurationMs} />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    flexGrow: 1,
  },
  headerRow: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two,
    marginHorizontal: Spacing.two,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
