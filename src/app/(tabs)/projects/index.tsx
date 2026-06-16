/**
 * Projects list screen — now the Projects tab's root (relocated from the old
 * top-level `projects/` group). Fetches the org-scoped projects via
 * {@link useProjects} and renders a pull-to-refreshable `FlatList` of pressable
 * rows that drill into the project detail (sections) screen.
 *
 * Type note: `useProjects()` returns data inferred from the backend `AppRouter`.
 * When the sibling `../cascade` repo is checked out those fields are statically
 * known; in an isolated checkout they degrade. We read the display fields
 * through a narrow local view ({@link ProjectListItem}) — the same cross-repo
 * narrowing idiom used by `org-context.tsx` / `auth-provider.tsx` — so rendering
 * stays typed (no `any`) and tolerates optional fields the contract may omit.
 */
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProjects } from '@/hooks/use-projects';

/** Narrow view of the `projects.list` output fields this screen renders. */
type ProjectListItem = {
  id: string;
  name: string;
  fullName?: string;
  repoFullName?: string;
  description?: string;
};

export default function ProjectsListScreen() {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, error, refetch, isRefetching } = useProjects();
  const projects = (data ?? []) as ProjectListItem[];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Projects' }} />
      {isPending ? (
        <Loading message="Loading projects…" />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refetch} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.three },
          ]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState message="No projects yet." />}
          renderItem={({ item }) => {
            const subtitle = item.repoFullName ?? item.fullName ?? item.description;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/projects/[projectId]',
                    params: { projectId: item.id, name: item.name },
                  })
                }
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  {subtitle ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {subtitle}
                    </ThemedText>
                  ) : null}
                </ThemedView>
              </Pressable>
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
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
