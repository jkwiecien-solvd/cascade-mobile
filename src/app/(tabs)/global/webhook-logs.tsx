/**
 * Global → Webhook Logs — IA placeholder for the inbound provider webhook log.
 * Real webhook-log data is a follow-up card.
 */
import { Stack } from 'expo-router/stack';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedView } from '@/components/themed-view';

export default function GlobalWebhookLogsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Webhook Logs' }} />
      <EmptyState message="Webhook logs are coming soon." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
