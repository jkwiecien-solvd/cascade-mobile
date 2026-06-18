/**
 * RunLogs — Logs section of the run detail screen.
 *
 * Owns its own `runs.getLogs` query (keyed by `runId`) and renders a
 * two-segment sub-toggle (Cascade Log / Engine Log) above the active log. The
 * log is split into lines and each line is rendered as a separate `FlatList`
 * item, with a search field above that filters the lines (case-insensitive
 * substring match). Mirrors the web client's `log-viewer.tsx`, and the
 * self-fetching idiom of sibling section `RunLlmCalls` (each section component
 * owns its query by `runId`).
 *
 * ## Design decisions
 * - **Self-fetching by `runId`** — the logs live on `runs.getLogs`, a separate
 *   procedure from `runs.getById`, so the screen can't hand them down. Same
 *   shape as `RunLlmCalls`/`useRunLlmCalls`.
 * - **Line-per-item list** — splitting on `\n` lets the search field filter
 *   individual lines while keeping the monospaced look. `FlatList`
 *   virtualizes, so large logs stay performant.
 * - **Sub-toggle** reuses the `Pressable` + `ThemedView` + `ThemedText` strip
 *   idiom from `RunSectionTabs` — no new shared abstraction; a future
 *   `SegmentedToggle` extraction may happen once a third consumer appears.
 * - **Word-wrap by default** — natural `Text` wrapping is the most readable
 *   on narrow screens and avoids nested-scroll gesture conflicts.
 * - **Loading / error / per-type empty state** via `query-states.tsx`.
 * - **`selectable`** on the log text so users can copy content.
 *
 * ## Type note
 * `runs.getLogs`'s output (`{ cascadeLog, engineLog }`) is inferred from the
 * backend `AppRouter`; the fields are read through the narrow {@link RunLogsData}
 * view so the component stays typed (no `any`). Confirmed against
 * `../cascade/src/api/routers/runs.ts` (`getLogs` → `getRunLogs`).
 */
import { useMemo, useState } from 'react';

import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

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

export function RunLogs({ runId }: { runId: string }) {
  const { data, isPending, isError, error, refetch } = useRunLogs(runId);
  const theme = useTheme();
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

  if (isPending) return <Loading message="Loading logs…" />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : undefined}
        onRetry={refetch}
      />
    );
  }

  const activeLogTab = LOG_TABS.find((t) => t.key === activeTab) ?? LOG_TABS[0];
  const hasContent = lines.length > 0;

  return (
    <View style={styles.container}>
      {/* Sub-toggle strip */}
      <View style={styles.tray}>
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

      {/* Search field + line list, or per-type empty state */}
      {hasContent ? (
        <View style={styles.body}>
          <View style={styles.searchTray}>
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

          <FlatList
            data={filteredLines}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ThemedText type="code" selectable style={styles.logLine}>
                {item.text === '' ? ' ' : item.text}
              </ThemedText>
            )}
            ListEmptyComponent={
              <EmptyState message={`No lines match “${query.trim()}”.`} />
            }
          />
        </View>
      ) : (
        <EmptyState message={activeLogTab.emptyMessage} />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tray: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
  body: {
    flex: 1,
  },
  searchTray: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  search: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  list: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexGrow: 1,
  },
  logLine: {
    paddingVertical: Spacing.half,
  },
});
