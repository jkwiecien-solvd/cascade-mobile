/**
 * Global → Organizations — IA placeholder for the all-organizations view.
 * Real organization data is a follow-up card.
 */
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function GlobalOrganizationsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Organizations' }} />
      <EmptyState message="Organizations are coming soon." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
