/**
 * Project section — a generic IA placeholder reading the `section` / `label`
 * route params (set by the detail screen) for its title. Each section's real
 * content is a follow-up card; this screen proves the list → detail → section
 * push path.
 */
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function ProjectSectionScreen() {
  const { section, label } = useLocalSearchParams<{ section: string; label?: string }>();
  const title = label ?? section ?? 'Section';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <EmptyState message={`${title} is coming soon.`} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
