/**
 * Project Work — the project-scoped runs feed. A static route under
 * `[projectId]/` that mirrors the Runs tab (`runs/index.tsx`) minus the filter
 * sheet/trigger: same `FlatList` + `RefreshControl` + `onEndReached` infinite
 * scroll + footer spinner + `ItemSeparatorComponent` idiom.
 *
 * Data flows through `useRuns({ projectId })` — the existing infinite hook
 * already folds `projectId` into both its query input and key, so no new data
 * layer is needed. The `[projectId]` route segment guarantees a non-empty
 * `projectId` at render.
 *
 * The header title is set to the `label` param (forwarded from the sections
 * list) or "Work" as a fallback. `headerRight` is NOT overridden here — the
 * org switcher comes from `ProjectsLayout`'s `stackScreenOptions`.
 *
 * Pressing a run card pushes `/runs/[runId]` in the Runs tab stack (same
 * cross-tab navigation pattern used by the Runs feed — see ROADMAP item 7).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { RunCard, type RunListItem } from '@/components/run-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRuns } from '@/hooks/use-runs';

export default function ProjectWorkScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { projectId, label } = useLocalSearchParams<{ projectId: string; label?: string }>();

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
  } = useRuns({ projectId });

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: label ?? 'Work' }} />

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
          ListEmptyComponent={<EmptyState message="No runs for this project yet." />}
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
    </View>
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
