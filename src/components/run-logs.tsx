/**
 * RunLogs — presentational component for the Logs section of the run detail.
 *
 * Renders a two-segment sub-toggle (Cascade Log / Engine Log) above the
 * active log in monospaced text (`ThemedText type="code"`), inside a vertical
 * `ScrollView`. The screen owns the data; this component stays presentational
 * (mirrors `RunCard` / `RunSectionTabs` / `RunOverview`).
 *
 * ## Design decisions
 * - **Sub-toggle** reuses the `Pressable` + `ThemedView` + `ThemedText` strip
 *   idiom from `RunSectionTabs` — no new shared abstraction; a future
 *   `SegmentedToggle` extraction may happen once a third consumer appears.
 * - **Word-wrap by default** — natural `Text` wrapping is the most readable
 *   on narrow screens and avoids nested-scroll gesture conflicts.
 * - **Per-type empty state** via `EmptyState` from `query-states.tsx`.
 * - **`selectable`** on the log text so users can copy content.
 * - Virtualization / chunking is explicitly **out of scope** (follow-up).
 *
 * ## Type note
 * The `cascadeLog` / `engineLog` field names match the expected `runs.getById`
 * output. Confirm against `../cascade/src/api/routers/runs.ts` in a checkout
 * where `AppRouter` resolves — they cannot be statically verified here (same
 * cross-repo narrowing caveat as `RunOverview` / `RunCard`).
 */
import { useState } from 'react';

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// ─── Sub-toggle model ──────────────────────────────────────────────────────

type LogType = 'cascade' | 'engine';

const LOG_TABS: readonly { key: LogType; label: string; emptyMessage: string }[] = [
  { key: 'cascade', label: 'Cascade Log', emptyMessage: 'No cascade log available.' },
  { key: 'engine', label: 'Engine Log', emptyMessage: 'No engine log available.' },
] as const;

// ─── Component ──────────────────────────────────────────────────────────────

export function RunLogs({
  cascadeLog,
  engineLog,
}: {
  cascadeLog?: string | null;
  engineLog?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<LogType>('cascade');
  const activeLogTab = LOG_TABS.find((t) => t.key === activeTab) ?? LOG_TABS[0];
  const activeContent = activeTab === 'cascade' ? cascadeLog : engineLog;
  const hasContent = activeContent != null && activeContent.trim().length > 0;

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

      {/* Log body or empty state */}
      {hasContent ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.logContent}>
          <ThemedText type="code" selectable>
            {activeContent}
          </ThemedText>
        </ScrollView>
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
  scroll: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  logContent: {
    padding: Spacing.three,
    flexGrow: 1,
  },
});
