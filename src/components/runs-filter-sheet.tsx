/**
 * RunsFilterSheet + FilterTrigger — the mobile-native filter UI for the Runs
 * feed (the web's inline `<select>` row reimagined as a bottom sheet + chips).
 *
 * The sheet reuses the `org-switcher-header.tsx` Modal + backdrop + bottom-sheet
 * pattern (no new dependency — `ai/RULES.md §2/§4`) and hosts three
 * {@link FilterChips} groups: **Status**, **Agent type**, and **Project**
 * (options from {@link useProjects}). {@link FilterTrigger} is the header-right
 * control showing the active-filter count; the Runs screen composes it next to
 * the org switcher so neither is dropped.
 *
 * The canonical Status / Agent-type option lists are defined here as constants
 * so their labels stay consistent with `formatAgentType` and the status badge.
 */
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChips, type FilterOption } from '@/components/filter-chips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProjects } from '@/hooks/use-projects';
import type { RunFilters } from '@/hooks/use-runs';
import { formatAgentType } from '@/lib/relative-time';

/** Canonical run-status filter options (labels mirror `RunStatusBadge`). */
export const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'timed_out', label: 'Timed out' },
];

/** Canonical agent-type filter options (labels via `formatAgentType`). */
export const AGENT_TYPE_FILTER_OPTIONS: FilterOption[] = [
  'splitting',
  'planning',
  'implementation',
  'review',
  'debug',
  'respond-to-review',
  'respond-to-pr-comment',
].map((value) => ({ value, label: formatAgentType(value) }));

/** Count of active (non-null) filter dimensions, for the trigger badge. */
export function activeFilterCount(filters: RunFilters): number {
  return [filters.status, filters.agentType, filters.projectId].filter(Boolean).length;
}

/** Narrow view of the `projects.list` output used to build project options. */
type ProjectOption = { id: string; name: string };

/** Header-right control opening the sheet, annotated with the active count. */
export function FilterTrigger({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Filter runs"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.trigger}>
        <ThemedText type="smallBold">{count > 0 ? `Filter (${count})` : 'Filter'}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function RunsFilterSheet({
  visible,
  filters,
  onChange,
  onClose,
}: {
  visible: boolean;
  filters: RunFilters;
  onChange: (filters: RunFilters) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { data } = useProjects();
  const projectOptions: FilterOption[] = ((data ?? []) as ProjectOption[]).map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const hasFilters = activeFilterCount(filters) > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop presses inside the sheet from closing it. */}
        <Pressable
          style={[styles.sheetWrapper, { paddingBottom: insets.bottom + Spacing.four }]}
          onPress={(event) => event.stopPropagation()}>
          <ThemedView type="background" style={styles.sheet}>
            <ThemedView style={styles.header}>
              <ThemedText type="smallBold">Filter runs</ThemedText>
              {hasFilters ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onChange({})}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="link">Clear all</ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              <FilterChips
                label="Status"
                options={STATUS_FILTER_OPTIONS}
                selected={filters.status ?? null}
                onChange={(value) => onChange({ ...filters, status: value ?? undefined })}
              />
              <FilterChips
                label="Agent type"
                options={AGENT_TYPE_FILTER_OPTIONS}
                selected={filters.agentType ?? null}
                onChange={(value) => onChange({ ...filters, agentType: value ?? undefined })}
              />
              {projectOptions.length > 0 ? (
                <FilterChips
                  label="Project"
                  options={projectOptions}
                  selected={filters.projectId ?? null}
                  onChange={(value) => onChange({ ...filters, projectId: value ?? undefined })}
                />
              ) : null}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  trigger: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  sheet: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scroll: {
    alignSelf: 'stretch',
  },
  scrollContent: {
    gap: Spacing.four,
  },
});
