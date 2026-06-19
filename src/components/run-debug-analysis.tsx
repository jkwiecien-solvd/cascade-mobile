/**
 * RunDebugAnalysis — renders debug analysis content for the run detail screen.
 *
 * Displays the run's debug analysis as scrollable monospaced text. When no
 * debug content is available, falls back to a centered empty state.
 *
 * ## Design decisions
 * - **No new hook** — `runs.getById` (already fetched by `useRun` in the
 *   detail screen) carries the debug field, so the component takes the
 *   **already-loaded `run` as a prop** (mirrors `RunOverview`; one fewer
 *   round-trip; contrast `RunLlmCalls`/`RunLogs`, which self-fetch their own
 *   procedures).
 * - **`type="code"` + `selectable`** — monospaced rendering matches diagnostic
 *   output. `selectable` gives users a free copy affordance (same as `RunLogs`
 *   line items). An explicit line-height override (18) improves readability
 *   since the base `type="code"` is 12px with no explicit line height.
 * - **Plain text only** — rich markdown rendering is an explicit follow-up.
 *   Structured/markdown content renders as plain text for now.
 *
 * ## Type note
 * {@link RunDebugAnalysisData} is a narrow local view (same cross-repo
 * narrowing idiom as `RunOverviewData` / `RunListItem`); every field but `id`
 * is optional so missing/renamed contract fields render the empty state,
 * never crash.
 *
 * ⚠️ **Unverified field name** — the sibling `../cascade` backend repo is
 * absent in this checkout, so `debugAnalysis` cannot be statically confirmed
 * against `../cascade/src/api/routers/runs.ts`. The narrow optional type means
 * a missing/renamed field gracefully degrades to the empty state. Confirm the
 * field name in a checkout where `AppRouter` resolves.
 */
import { ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/query-states';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';

// ─── Narrow local type ──────────────────────────────────────────────────────

/**
 * Narrow view of the fields this component renders.
 * Every field but `id` is optional so missing/renamed contract fields render
 * the empty state, never crash (same idiom as `RunOverviewData` / `RunListItem`).
 */
export type RunDebugAnalysisData = {
  id: string;
  debugAnalysis?: string;
};

// ─── RunDebugAnalysis ───────────────────────────────────────────────────────

export function RunDebugAnalysis({ run }: { run: RunDebugAnalysisData }) {
  const content = run.debugAnalysis?.trim();

  if (!content) {
    return <EmptyState message="No debug analysis available for this run." />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <ThemedText type="code" selectable style={styles.codeText}>
        {content}
      </ThemedText>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    padding: Spacing.three,
    flexGrow: 1,
  },
  codeText: {
    lineHeight: 18,
  },
});
