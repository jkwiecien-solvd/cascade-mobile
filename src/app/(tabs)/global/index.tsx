/**
 * Global hub (superadmin only) — lists the four platform-wide admin areas as
 * pressable rows that push their placeholder screens. IA only this card; each
 * area's content (cross-org runs, webhook logs, agent definitions, orgs) is a
 * follow-up.
 */
import { router, type Href } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type GlobalArea = { href: Href; title: string; subtitle: string };

const AREAS: GlobalArea[] = [
  { href: '/global/runs', title: 'Global Runs', subtitle: 'Runs across every organization' },
  { href: '/global/webhook-logs', title: 'Webhook Logs', subtitle: 'Inbound provider webhooks' },
  {
    href: '/global/agent-definitions',
    title: 'Agent Definitions',
    subtitle: 'Configured agent types',
  },
  { href: '/global/organizations', title: 'Organizations', subtitle: 'All organizations' },
];

export default function GlobalHubScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Global' }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four },
        ]}>
        {AREAS.map((area) => (
          <Pressable
            key={area.title}
            accessibilityRole="button"
            onPress={() => router.push(area.href)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText type="smallBold">{area.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {area.subtitle}
              </ThemedText>
            </ThemedView>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
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
