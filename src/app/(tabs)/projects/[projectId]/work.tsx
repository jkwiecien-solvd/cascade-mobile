/**
 * Project Work — the project-scoped runs feed with Status / Agent-type filter
 * controls. A static route under `[projectId]/` that mirrors the Runs tab
 * (`runs/index.tsx`): same `FlatList` + `RefreshControl` + `onEndReached`
 * infinite scroll + footer spinner + `ItemSeparatorComponent` idiom, plus a
 * header-right "Filter (n)" trigger + `RunsFilterSheet` (with the Project
 * dimension hidden — the route's `projectId` is always pinned).
 *
 * Data flows through `useRuns({ ...filters, projectId })` — the existing
 * infinite hook already folds filters + `projectId` into both its query input
 * and key, so a filter change resets paging to page 1 automatically.
 *
 * `headerRight` composes the {@link FilterTrigger} alongside the
 * {@link OrgSwitcherHeader} — overriding `headerRight` on this screen replaces
 * the layout's default, so the org switcher must be re-included explicitly.
 *
 * Pressing a run card pushes `/runs/[runId]` in the Runs tab stack (same
 * cross-tab navigation pattern used by the Runs feed — see ROADMAP item 7).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrgSwitcherHeader } from '@/components/org-switcher-header';
import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { RunCard, type RunListItem } from '@/components/run-card';
import {
  activeFilterCount,
  FilterTrigger,
  RunsFilterSheet,
} from '@/components/runs-filter-sheet';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type RunFilters, useRuns } from '@/hooks/use-runs';

export default function ProjectWorkScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { projectId, label } = useLocalSearchParams<{ projectId: string; label?: string }>();

  const [filters, setFilters] = useState<RunFilters>({ projectId });
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    runs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
    isPending,
    isError,
    error,
  } = useRuns({ ...filters, projectId });

  // Narrow to the rendered view and dedupe by `id` — same defensive guard as
  // the Runs feed (see `runs/index.tsx`).
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (runs as RunListItem[]).filter((run) => {
      if (seen.has(run.id)) return false;
      seen.add(run.id);
      return true;
    });
  }, [runs]);

  const filterCount = activeFilterCount(filters, { includeProject: false });
  const hasActiveFilters = filterCount > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: label ?? 'Work',
          headerRight: () => (
            <View style={styles.headerRight}>
              <FilterTrigger count={filterCount} onPress={() => setFilterOpen(true)} />
              <OrgSwitcherHeader />
            </View>
          ),
        }}
      />

      {isPending ? (
        <Loading message="Loading runs…" />
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
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState
              message={
                hasActiveFilters
                  ? 'No runs match these filters.'
                  : 'No runs for this project yet.'
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.textSecondary }]} />
          )}
          renderItem={({ item }) => (
            <RunCard
              run={item}
              onPress={() =>
                router.push({ pathname: '/runs/[runId]', params: { runId: item.id } })
              }
            />
          )}
        />
      )}

      <RunsFilterSheet
        visible={filterOpen}
        filters={filters}
        onChange={(next) => setFilters({ ...next, projectId })}
        onClose={() => setFilterOpen(false)}
        hideProjectFilter
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  list: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: Spacing.three,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.two,
    opacity: 0.25,
  },
});
