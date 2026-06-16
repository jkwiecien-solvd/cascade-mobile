/**
 * Project detail — the project's **sections list**. Replaces the old runs-list
 * detail screen: it renders the seven project sections (General, Engine,
 * Integrations, Agents, Lifecycle, Work, Stats) as pressable rows that push the
 * generic `[section]` placeholder.
 *
 * The project name arrives via the route param set by the list screen and is
 * used as the stack title (falling back to a generic title when absent), and is
 * threaded through to the section screen so it can show a contextual header.
 *
 * Scope (this card): IA only. Each section's real content is a follow-up; the
 * retained `use-project-runs.ts` + `run-status-badge.tsx` will back the "Work"
 * section / cross-project runs feed later.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

/** The project sections, mirroring the web dashboard's project IA. */
const SECTIONS: { section: string; label: string; description: string }[] = [
  { section: 'general', label: 'General', description: 'Name, repository, and basics' },
  { section: 'engine', label: 'Engine', description: 'Agent engine configuration' },
  { section: 'integrations', label: 'Integrations', description: 'GitHub and PM provider links' },
  { section: 'agents', label: 'Agents', description: 'Enabled agent types' },
  { section: 'lifecycle', label: 'Lifecycle', description: 'Workflow stages and transitions' },
  { section: 'work', label: 'Work', description: 'Work items and runs' },
  { section: 'stats', label: 'Stats', description: 'Activity and throughput' },
];

export default function ProjectDetailScreen() {
  const insets = useSafeAreaInsets();
  const { projectId, name } = useLocalSearchParams<{ projectId: string; name?: string }>();
  const title = name ?? 'Project';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.three },
        ]}>
        {SECTIONS.map((item) => (
          <Pressable
            key={item.section}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/projects/[projectId]/[section]',
                params: { projectId, section: item.section, label: item.label },
              })
            }
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText type="smallBold">{item.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.description}
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    flexGrow: 1,
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
