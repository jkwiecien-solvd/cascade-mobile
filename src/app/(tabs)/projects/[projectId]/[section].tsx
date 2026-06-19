/**
 * Project section — routes section-specific content for a project.
 *
 * Reads the `projectId`, `section`, and `label` route params; branches on
 * `section` to render real content (e.g. `ProjectStats` for "stats") or an
 * `EmptyState` placeholder for sections not yet implemented.
 */
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { ProjectStats } from '@/components/project-stats';
import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function ProjectSectionScreen() {
  const { projectId, section, label } = useLocalSearchParams<{
    projectId: string;
    section: string;
    label?: string;
  }>();
  const title = label ?? section ?? 'Section';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />
      {section === 'stats' && projectId ? (
        <ProjectStats projectId={projectId} />
      ) : (
        <EmptyState message={`${title} is coming soon.`} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
