/**
 * Global → Agent Definitions — IA placeholder for the configured agent types
 * view. Real agent-definition data is a follow-up card.
 */
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function GlobalAgentDefinitionsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Agent Definitions' }} />
      <EmptyState message="Agent definitions are coming soon." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
