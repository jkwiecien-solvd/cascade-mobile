/**
 * Global → Runs — IA placeholder for the platform-wide (cross-org) runs view.
 * Real cross-org run data is a follow-up card.
 */
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function GlobalRunsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Global Runs' }} />
      <EmptyState message="Cross-organization runs are coming soon." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
