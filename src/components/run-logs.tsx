/**
 * RunLogs — Logs section of the run detail screen.
 *
 * Owns its own `runs.getLogs` query (keyed by `runId`) and renders a single
 * `SectionList` so the run's header card (passed as {@link header}) scrolls
 * away as real content while the navigation tabs (passed as {@link tabs}), the
 * Cascade/Engine sub-toggle, and the filter field stay **sticky** at the top.
 *
 * The log is split into lines and each line is a separate list item, with the
 * filter field running a case-insensitive substring match over them. Mirrors
 * the web client's `log-viewer.tsx`.
 *
 * ## Why a single SectionList (not an animated collapsing header)
 * An earlier version animated a separate header's height in response to
 * `onScroll`. Because that header shared the vertical flex column with the
 * list, collapsing it dragged the list up the screen at scroll speed —
 * doubling apparent scroll velocity and oscillating around the fully-collapsed
 * point ("shivers"). Making the card a real scroll item removes the feedback
 * loop entirely: the scroll *is* the motion, so it can't fight itself.
 *
 * ## Design decisions
 * - **Self-fetching by `runId`** — the logs live on `runs.getLogs`, a separate
 *   procedure from `runs.getById`. Same shape as `RunLlmCalls`/`useRunLlmCalls`.
 * - **Sticky chrome** (tabs + sub-toggle + filter) sits in `renderSectionHeader`
 *   over an opaque `ThemedView` so scrolling lines don't bleed through.
 * - **Loading / error / per-type empty state** route through
 *   `ListEmptyComponent`, so the tabs stay visible (and switchable) regardless.
 * - **`selectable`** on each line so users can copy content.
 *
 * ## Type note
 * `runs.getLogs`'s output (`{ cascadeLog, engineLog }`) is inferred from the
 * backend `AppRouter`; the fields are read through the narrow {@link RunLogsData}
 * view so the component stays typed (no `any`). Confirmed against
 * `../cascade/src/api/routers/runs.ts` (`getLogs` → `getRunLogs`).
 */
import { type ReactElement, useMemo, useState } from 'react';

import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRunLogs } from '@/hooks/use-run-logs';
import { useTheme } from '@/hooks/use-theme';

// ─── Sub-toggle model ──────────────────────────────────────────────────────

type LogType = 'cascade' | 'engine';

const LOG_TABS: readonly { key: LogType; label: string; emptyMessage: string }[] = [
  { key: 'cascade', label: 'Cascade Log', emptyMessage: 'No cascade log available.' },
  { key: 'engine', label: 'Engine Log', emptyMessage: 'No engine log available.' },
] as const;

/**
 * Narrow view of the `runs.getLogs` output fields this component renders.
 * Both fields optional/nullable so a partial or empty row renders the per-type
 * empty state, never crashes (same narrowing idiom as `RunListItem`).
 */
type RunLogsData = {
  cascadeLog?: string | null;
  engineLog?: string | null;
};

/** One log line, keyed by its original index so filtering stays stable. */
type LogLine = { id: number; text: string };

// ─── Component ──────────────────────────────────────────────────────────────

export function RunLogs({
  runId,
  header,
  tabs,
}: {
  runId: string;
  /** Run header card — scrolls away as the list's `ListHeaderComponent`. */
  header?: ReactElement | null;
  /** Section navigation tabs — pinned in the sticky section header. */
  tabs?: ReactElement | null;
}) {
  const { data, isPending, isError, error, refetch } = useRunLogs(runId);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LogType>('cascade');
  const [query, setQuery] = useState('');

  const logs = (data ?? null) as RunLogsData | null;
  const activeContent = activeTab === 'cascade' ? logs?.cascadeLog : logs?.engineLog;

  // Split the active log into one item per line.
  const lines = useMemo<LogLine[]>(() => {
    if (!activeContent) return [];
    return activeContent.split('\n').map((text, index) => ({ id: index, text }));
  }, [activeContent]);

  // Case-insensitive substring filter over the lines.
  const trimmedQuery = query.trim().toLowerCase();
  const filteredLines = useMemo<LogLine[]>(() => {
    if (!trimmedQuery) return lines;
    return lines.filter((line) => line.text.toLowerCase().includes(trimmedQuery));
  }, [lines, trimmedQuery]);

  const isReady = !isPending && !isError;
  const activeLogTab = LOG_TABS.find((t) => t.key === activeTab) ?? LOG_TABS[0];

  // Body items only once loaded; loading/error/empty go via ListEmptyComponent.
  const sectionData: LogLine[] = isReady ? filteredLines : [];

  const emptyComponent = isPending ? (
    <Loading message="Loading logs…" />
  ) : isError ? (
    <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refetch} />
  ) : lines.length === 0 ? (
    <EmptyState message={activeLogTab.emptyMessage} />
  ) : (
    <EmptyState message={`No lines match “${query.trim()}”.`} />
  );

  return (
    <SectionList
      sections={[{ data: sectionData }]}
      keyExtractor={(item) => String(item.id)}
      style={styles.list}
      contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.three }]}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled
      ListHeaderComponent={header ?? null}
      renderSectionHeader={() => (
        <ThemedView style={styles.stickyHeader}>
          {tabs}

          {/* Cascade / Engine sub-toggle + filter — only once logs are loaded. */}
          {isReady ? (
            <View style={styles.controls}>
              <View style={styles.subToggleTray}>
                <ThemedView type="backgroundElement" style={styles.strip}>
                  {LOG_TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                      <Pressable
                        key={tab.key}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={tab.label}
                        onPress={() => setActiveTab(tab.key)}
                        style={({ pressed }) => [styles.segment, pressed && styles.pressed]}>
                        <ThemedView
                          type={isActive ? 'backgroundSelected' : 'backgroundElement'}
                          style={styles.segmentInner}>
                          <ThemedText
                            type={isActive ? 'smallBold' : 'small'}
                            themeColor={isActive ? 'text' : 'textSecondary'}
                            numberOfLines={1}>
                            {tab.label}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    );
                  })}
                </ThemedView>
              </View>

              <TextInput
                style={[
                  styles.search,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
                value={query}
                onChangeText={setQuery}
                placeholder="Filter log lines…"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
          ) : null}
        </ThemedView>
      )}
      renderItem={({ item }) => (
        <ThemedText type="code" selectable style={styles.logLine}>
          {item.text === '' ? ' ' : item.text}
        </ThemedText>
      )}
      // SectionList always counts a header+footer per section, so itemCount is
      // never 0 and ListEmptyComponent never fires — render the state in the
      // (always-rendered) section footer instead.
      renderSectionFooter={() =>
        sectionData.length === 0 ? <View style={styles.stateFooter}>{emptyComponent}</View> : null
      }
    />
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    flexGrow: 1,
  },
  stickyHeader: {
    paddingBottom: Spacing.two,
  },
  controls: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  subToggleTray: {
    width: '100%',
  },
  strip: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.one,
  },
  segment: {
    flex: 1,
  },
  segmentInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  search: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  logLine: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  stateFooter: {
    minHeight: 240,
  },
});
