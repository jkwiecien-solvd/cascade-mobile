/**
 * Settings → Users — IA placeholder satisfying the Settings General/Users
 * structure. User management content is a follow-up card.
 */
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function SettingsUsersScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Users' }} />
      <EmptyState message="User management is coming soon." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
