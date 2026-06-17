/**
 * RunOverview — label/value overview rows for the run detail screen.
 *
 * Renders the run's key fields (engine, trigger, model, iterations, gadget
 * calls, started/completed times, duration, cost, result, error, and an
 * output summary) as full-width iOS-Settings-style detail rows.
 *
 * ## Design decisions
 * - **No new hook** — `runs.getById` (already fetched by `useRun` in the
 *   header story) carries every overview field, so the component takes the
 *   **already-loaded `run` as a prop** (one fewer round-trip; contrast
 *   `RunLlmCalls`, which owns a separate endpoint).
 * - **Reuse** — `LiveDuration` (ticking `useEffect`+`setInterval`+cleanup)
 *   for running runs; `formatDuration` / `formatCost` / `formatRelativeTime`
 *   for completed runs; `Collapsible` for long output; and the `DetailRow`
 *   label/value idiom from `run-llm-calls.tsx`.
 * - **Cost** uses `formatCost` (2-decimal) — *not* the sub-cent `formatLlmCost`
 *   — because `costUsd` here is the whole-run cost, the same field `RunCard`
 *   renders. `formatCost` is documented as the correct formatter for whole-run
 *   costs; `formatLlmCost` is the per-call variant. Sharing one representation
 *   keeps a run's cost identical in the feed card and this detail view.
 *
 * ## Type note
 * {@link RunOverviewData} is a narrow local view (same cross-repo narrowing
 * idiom as `RunListItem` / `LlmCallItem`); every field but `id` is optional
 * so missing/renamed contract fields render blank, never crash.
 *
 * Caveat (same as `run-card.tsx`): because the consumer casts (`data as
 * RunDetail`) and every field but `id` is optional, a *misnamed* field (e.g.
 * `triggerType` vs `trigger`) is NOT a compile error — it simply renders blank.
 * These names must be confirmed against `../cascade/src/api/routers/runs.ts` in
 * a checkout where `AppRouter` resolves (the sibling repo is absent here, so
 * they cannot be statically verified). To limit the blast radius of a silent
 * mismatch, `Result` falls back to the confirmed `status` field when `success`
 * is absent (see `formatResult`).
 */
import { ScrollView, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { LiveDuration } from '@/components/live-duration';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatCost, formatDuration, formatRelativeTime } from '@/lib/relative-time';

// ─── Narrow local type ──────────────────────────────────────────────────────

/**
 * Narrow view of the fields this component renders.
 * Every field but `id` is optional so missing/renamed contract fields render
 * blank, never crash (same idiom as `RunListItem` / `LlmCallItem`).
 */
export type RunOverviewData = {
  id: string;
  status?: string;
  engine?: string;
  triggerType?: string;
  model?: string;
  llmIterations?: number;
  maxIterations?: number;
  gadgetCalls?: number;
  startedAt?: string | number | Date;
  completedAt?: string | number | Date;
  durationMs?: number;
  costUsd?: number | string;
  success?: boolean;
  error?: string;
  outputSummary?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** True while the run is actively executing (drives the live-ticking duration). */
function isRunning(status: string | undefined): boolean {
  const s = status?.toLowerCase();
  return s === 'running' || s === 'in_progress';
}

/**
 * Result label for the run. Prefers the explicit `success` boolean, but falls
 * back to deriving Succeeded/Failed from the **confirmed** `status` field (the
 * same vocabulary `RunStatusBadge` maps) when `success` is absent. This guards
 * against the silent-blank risk flagged in review: if `success` were misnamed
 * in the contract it would always be `undefined`, but the row still populates
 * from `status` rather than staying permanently empty. Non-terminal states
 * (running/queued/pending) return `null` so no premature result is shown.
 */
function formatResult(success: boolean | undefined, status: string | undefined): string | null {
  if (success === true) return 'Succeeded';
  if (success === false) return 'Failed';
  const s = status?.toLowerCase();
  if (s === 'succeeded' || s === 'success' || s === 'completed') return 'Succeeded';
  if (s === 'failed' || s === 'error' || s === 'timed_out' || s === 'timed out') return 'Failed';
  return null;
}

/**
 * Heuristic for "long" output: more than 160 characters or 3+ newlines.
 * RN cannot cheaply measure rendered line count pre-layout, so a
 * char/newline heuristic is a pragmatic stand-in.
 */
function isLongOutput(text: string): boolean {
  if (text.length > 160) return true;
  const newlines = text.split('\n').length - 1;
  return newlines >= 3;
}

// ─── OverviewRow ────────────────────────────────────────────────────────────

/** A single label / value detail row (mirrors `DetailRow` from `run-llm-calls.tsx`). */
function OverviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText type="default" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

// ─── RunOverview ────────────────────────────────────────────────────────────

export function RunOverview({ run }: { run: RunOverviewData }) {
  const running = isRunning(run.status);

  // Iterations: "3 / 10" when both present, else "3".
  const iterations =
    run.llmIterations != null
      ? run.maxIterations != null
        ? `${run.llmIterations} / ${run.maxIterations}`
        : `${run.llmIterations}`
      : null;

  // Result: explicit `success` boolean, else derived from the confirmed `status`.
  const result = formatResult(run.success, run.status);

  // Cost: whole-run cost → 2-decimal `formatCost`, same as `RunCard`.
  const cost = formatCost(run.costUsd);

  // Duration for completed runs.
  const completedDuration = formatDuration(run.durationMs);

  // Output summary collapsibility.
  const outputSummary = run.outputSummary ?? null;
  const longOutput = outputSummary != null && isLongOutput(outputSummary);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}>
      {/* Static rows */}
      <OverviewRow label="Engine" value={run.engine} />
      <OverviewRow label="Trigger" value={run.triggerType} />
      <OverviewRow label="Model" value={run.model} />
      <OverviewRow label="Iterations" value={iterations} />
      <OverviewRow label="Gadget calls" value={run.gadgetCalls != null ? `${run.gadgetCalls}` : null} />
      <OverviewRow label="Started" value={formatRelativeTime(run.startedAt)} />
      <OverviewRow label="Completed" value={formatRelativeTime(run.completedAt)} />

      {/* Duration: live-ticking for running runs, stored for completed. */}
      {running && run.startedAt != null ? (
        <View style={styles.detailRow}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
            Duration
          </ThemedText>
          <LiveDuration startedAt={run.startedAt} type="default" />
        </View>
      ) : completedDuration ? (
        <OverviewRow label="Duration" value={completedDuration} />
      ) : null}

      {/* Result */}
      <OverviewRow label="Result" value={result} />

      {/* Cost */}
      <OverviewRow label="Cost" value={cost} />

      {/* Error — render in error-red when present */}
      {run.error ? (
        <View style={styles.detailRow}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
            Error
          </ThemedText>
          <ThemedText type="default" style={[styles.detailValue, styles.errorText]}>
            {run.error}
          </ThemedText>
        </View>
      ) : null}

      {/* Output summary — collapsible when long, inline otherwise */}
      {outputSummary ? (
        longOutput ? (
          <View style={styles.outputBlock}>
            <Collapsible title="Output">
              <ThemedText type="default">{outputSummary}</ThemedText>
            </Collapsible>
          </View>
        ) : (
          <OverviewRow label="Output" value={outputSummary} />
        )
      ) : null}
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
    gap: Spacing.one,
    flexGrow: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  detailLabel: {
    width: 100,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
  },
  errorText: {
    color: '#e5484d',
  },
  outputBlock: {
    paddingVertical: Spacing.half,
  },
});
