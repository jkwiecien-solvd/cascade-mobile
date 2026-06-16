/**
 * Run detail — IA placeholder pushed from the runs feed so the drill-in path is
 * wired. The real run timeline / status / PR view is a follow-up card; this
 * screen reads the `runId` route param and shows it in a neutral empty state.
 */
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function RunDetailScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Run' }} />
      <EmptyState message={`Run detail for ${runId} is coming soon.`} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
