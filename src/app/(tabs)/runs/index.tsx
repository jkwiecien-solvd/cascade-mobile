/**
 * Runs feed — the app's default tab and the mobile equivalent of cascade-web's
 * `/` home runs view. Rather than porting the dense multi-column web table, this
 * renders a vertically scrolling `FlatList` of one {@link RunCard} per run,
 * reusing the established `projects/index.tsx` list idiom (`FlatList` +
 * `RefreshControl` + `query-states`).
 *
 * Data comes from the cross-project {@link useRuns} infinite hook (org-scoped,
 * offset/limit paging). Infinite scroll loads the next page near the end;
 * pull-to-refresh and standard loading / empty / error states mirror the
 * projects screen. `showOrg` is driven by the account role (`useIsSuperadmin`),
 * distinct from `useOrg().isSuperadmin` (org count).
 *
 * Filters (status / agent type / project) live in screen state and feed
 * {@link useRuns}; the hook folds them into its query key so changing a filter
 * resets paging to page 1 automatically. The header-right composes the
 * {@link FilterTrigger} with the shared {@link OrgSwitcherHeader} so the org
 * switcher injected by `runs/_layout.tsx` is not dropped.
 *
 * Type note: `useRuns` returns rows inferred from the backend `AppRouter`; the
 * `../cascade` repo is absent in this checkout, so rendering reads them through
 * the narrow {@link RunListItem} view (no `any`), tolerating optional fields.
 */
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrgSwitcherHeader } from '@/components/org-switcher-header';
import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { RunCard, type RunListItem } from '@/components/run-card';
import { ThemedView } from '@/components/themed-view';
import {
  activeFilterCount,
  FilterTrigger,
  RunsFilterSheet,
} from '@/components/runs-filter-sheet';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type RunFilters, useRuns } from '@/hooks/use-runs';

export default function RunsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [filters, setFilters] = useState<RunFilters>({});
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
  } = useRuns(filters);

  // Narrow to the rendered view and dedupe by `id`. The dedupe is a defensive
  // guard: if the backend ever returns overlapping pages (e.g. a paging input
  // key is named differently than assumed and silently ignored), this keeps
  // `keyExtractor={item.id}` from emitting duplicate-key warnings rather than
  // crashing the list.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (runs as RunListItem[]).filter((run) => {
      if (seen.has(run.id)) return false;
      seen.add(run.id);
      return true;
    });
  }, [runs]);
  const filterCount = activeFilterCount(filters);
  const hasActiveFilters = filterCount > 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Runs',
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
              message={hasActiveFilters ? 'No runs match these filters.' : 'No runs yet.'}
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
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
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
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </ThemedView>
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
  },
});
