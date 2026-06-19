/**
 * PR Runs — drill-down screen listing runs for a single pull request.
 *
 * The mobile equivalent of cascade-web's `prs/$projectId.$prNumber` route.
 * Renders a `FlatList` of `RunCard`s backed by the `prs.runs` procedure, with
 * the standard Loading / Empty / Error states and pull-to-refresh. Tapping a
 * run pushes the existing run detail screen.
 *
 * The screen title is "PR #<number>" derived from the route param. `headerRight`
 * (org switcher) is inherited from `ProjectsLayout`.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { RunCard, type RunListItem } from '@/components/run-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { usePrRuns } from '@/hooks/use-pr-runs';

export default function PrRunsScreen() {
  const insets = useSafeAreaInsets();
  const { projectId, prNumber: prNumberParam } = useLocalSearchParams<{
    projectId: string;
    prNumber: string;
  }>();

  const prNumber = prNumberParam ? Number(prNumberParam) : undefined;

  const { data, isPending, isError, error, refetch, isRefetching } =
    usePrRuns(projectId, prNumber);

  const runs = useMemo(() => (data ?? []) as RunListItem[], [data]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ title: prNumber != null ? `PR #${prNumber}` : 'PR Runs' }}
      />

      {isPending ? (
        <Loading message="Loading runs..." />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.three },
          ]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={
            runs.length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {runs.length} {runs.length === 1 ? 'run' : 'runs'}
              </ThemedText>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState message="No runs for this PR yet." />
          }
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
    gap: Spacing.two,
    flexGrow: 1,
  },
});
