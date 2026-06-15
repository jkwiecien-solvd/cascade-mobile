/**
 * Project detail screen — lists the runs for one project, the leaf of the
 * end-to-end typed path. The project name is passed via route params from the
 * list screen (set as the stack header title) so the header needs no extra
 * round-trip; it falls back to a generic title when absent.
 *
 * Runs are fetched via {@link useProjectRuns} and rendered with the shared
 * loading / empty / error / pull-to-refresh treatment plus a `RunStatusBadge`.
 * As on the list screen, the run fields are read through a narrow local view
 * ({@link RunListItem}) so rendering stays typed and tolerant of optional fields.
 */
import { Stack } from 'expo-router/stack';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { RunStatusBadge } from '@/components/run-status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProjectRuns } from '@/hooks/use-project-runs';

/** Narrow view of the run fields this screen renders. */
type RunListItem = {
  id: string;
  status: string;
  type?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
};

/** Best-effort timestamp formatter; returns null for missing/invalid values. */
function formatTimestamp(value: string | number | Date | undefined): string | null {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export default function ProjectRunsScreen() {
  const insets = useSafeAreaInsets();
  const { projectId, name } = useLocalSearchParams<{ projectId: string; name?: string }>();
  const { data, isPending, isError, error, refetch, isRefetching } = useProjectRuns(projectId);
  const runs = (data ?? []) as RunListItem[];

  const title = name ?? 'Project';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />
      {isPending ? (
        <Loading message="Loading runs…" />
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
          ListEmptyComponent={<EmptyState message="No runs for this project yet." />}
          renderItem={({ item }) => {
            const timestamp = formatTimestamp(item.createdAt ?? item.updatedAt);
            return (
              <ThemedView type="backgroundElement" style={styles.row}>
                <ThemedView style={styles.rowHeader}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.runLabel}>
                    {item.type ?? 'Run'}
                  </ThemedText>
                  <RunStatusBadge status={item.status} />
                </ThemedView>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {item.id}
                </ThemedText>
                {timestamp ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {timestamp}
                  </ThemedText>
                ) : null}
              </ThemedView>
            );
          }}
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
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  runLabel: {
    flexShrink: 1,
  },
});
