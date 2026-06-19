/**
 * Work Item Runs — drill-down screen listing runs for a single work item.
 *
 * The mobile equivalent of cascade-web's `work-items/$projectId.$workItemId`
 * route. Renders a `FlatList` of `RunCard`s backed by the `workItems.runs`
 * procedure, with the standard Loading / Empty / Error states and
 * pull-to-refresh. Tapping a run pushes the existing run detail screen.
 *
 * The screen title is set from a `title` route param passed by the caller
 * (the work-item title from `WorkItemCard`), falling back to "Work Item Runs".
 * `headerRight` (org switcher) is inherited from `ProjectsLayout`.
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
import { useWorkItemRuns } from '@/hooks/use-work-item-runs';

export default function WorkItemRunsScreen() {
  const insets = useSafeAreaInsets();
  const { projectId, workItemId, title } = useLocalSearchParams<{
    projectId: string;
    workItemId: string;
    title?: string;
  }>();

  const { data, isPending, isError, error, refetch, isRefetching } =
    useWorkItemRuns(projectId, workItemId);

  const runs = useMemo(() => (data ?? []) as RunListItem[], [data]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: title ?? 'Work Item Runs' }} />

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
            <EmptyState message="No runs for this work item yet." />
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
