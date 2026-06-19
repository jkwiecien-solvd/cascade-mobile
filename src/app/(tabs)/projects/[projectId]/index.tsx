/**
 * Project detail — the project's **sections list**. Renders the project
 * sections (Work, Stats) as pressable rows. The "Work" row pushes the
 * dedicated `work.tsx` static route (project-scoped runs feed); other rows
 * push the generic `[section]` placeholder.
 *
 * The project name arrives via the route param set by the list screen and is
 * used as the stack title (falling back to a generic title when absent), and is
 * threaded through to the section screen so it can show a contextual header.
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
              item.section === 'work'
                ? router.push({
                    pathname: '/projects/[projectId]/work',
                    params: { projectId, label: item.label },
                  })
                : router.push({
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
