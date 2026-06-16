/**
 * Runs feed — the app's default tab and the web dashboard's `/` home.
 *
 * Scope (this card): navigation-ready IA placeholder only. The cross-project
 * runs feed itself is a follow-up that will reuse {@link RunStatusBadge} plus a
 * new cross-project runs hook; for now this screen establishes the tab and a
 * pressable row that drills into the `[runId]` detail so the navigation path is
 * wired end-to-end.
 */
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function RunsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Runs' }} />
      <ThemedView style={styles.content}>
        <EmptyState message="The cross-project runs feed is coming soon." />
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/runs/[runId]', params: { runId: 'example' } })
          }
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView type="backgroundElement" style={styles.previewButton}>
            <ThemedText type="link">Preview run detail</ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  previewButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
