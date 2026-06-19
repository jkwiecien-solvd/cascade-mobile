/**
 * ProjectStats — summary metric grid + per-agent-type breakdown for a project's
 * Stats section.
 *
 * Owns the {@link useProjectStats} hook (parallels `RunLlmCalls` owning
 * `useRunLlmCalls`) and renders:
 * 1. A 2-column grid of {@link StatCard}s for the key KPIs: total runs, success
 *    rate, total cost, and average duration (mirrors the web Stats page's
 *    `StatsSummary`).
 * 2. A "By agent type" breakdown section below the grid, rendering one
 *    {@link AgentStatsRow} per agent type with run count, success rate, and
 *    average cost — sorted by run count descending, zero-run agents omitted.
 *
 * Pull-to-refresh via `RefreshControl` covers both sections.
 *
 * ## Type note
 * The `prs.workStatsAggregated` procedure returns `{ summary, byAgentType }`;
 * this screen reads both blocks. {@link StatsSummary} and {@link AgentTypeStat}
 * are narrow local views (same cross-repo narrowing idiom as `RunListItem` /
 * `RunOverviewData`); every field is optional so a missing/renamed contract
 * field renders blank, never crashes.
 *
 * Caveat (same as `run-overview.tsx`): because the consumer casts and every
 * field is optional, a *misnamed* field is NOT a compile error — it simply
 * renders blank. These names are verified against
 * `../cascade/src/db/repositories/runStatsRepository.ts`
 * (`getProjectWorkStatsAggregated`).
 */
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AgentStatsRow } from '@/components/agent-stats-row';
import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProjectStats } from '@/hooks/use-project-stats';
import { useTheme } from '@/hooks/use-theme';
import { formatAgentType, formatCost, formatDuration, formatPercentage } from '@/lib/relative-time';

// ─── Narrow local type ──────────────────────────────────────────────────────

/**
 * Narrow view of the `summary` block returned by `prs.workStatsAggregated`.
 * Every field is optional so a missing/renamed contract field renders blank,
 * never crashes (same idiom as `RunOverviewData`).
 *
 * Field names verified against `getProjectWorkStatsAggregated` in
 * `../cascade/src/db/repositories/runStatsRepository.ts`. Note `successRate` is
 * a 0–100 percentage and `totalCostUsd` / `avgDurationMs` may be a string /
 * `null` respectively.
 */
type StatsSummary = {
  totalRuns?: number;
  completedRuns?: number;
  failedRuns?: number;
  timedOutRuns?: number;
  successRate?: number;
  totalCostUsd?: number | string;
  avgDurationMs?: number | null;
};

/**
 * Narrow view of one element in the `byAgentType` array returned by
 * `prs.workStatsAggregated`. Field names mirror the `StatsSummary` block above
 * (both are produced by `getProjectWorkStatsAggregated`). Every field is
 * optional — the established "missing field → blank, never crash" idiom.
 */
type AgentTypeStat = {
  agentType?: string;
  totalRuns?: number;
  completedRuns?: number;
  successRate?: number;
  totalCostUsd?: number | string;
  avgDurationMs?: number | null;
};

/** Full procedure output; this screen renders `summary` and `byAgentType`. */
type ProjectStatsData = {
  summary?: StatsSummary;
  byAgentType?: AgentTypeStat[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive a success-rate ratio (0–1) tolerantly:
 * - Use `successRate` when present (the backend sends a 0–100 percentage, so
 *   values > 1 are divided by 100; values ≤ 1 are passed through defensively).
 * - Fall back to `completedRuns / totalRuns` when both are present.
 * - Return `null` otherwise.
 */
function deriveSuccessRate(summary: StatsSummary): number | null {
  if (summary.successRate != null && Number.isFinite(summary.successRate)) {
    // Backend sends a percentage (e.g. 95); normalize to a 0–1 ratio.
    return summary.successRate > 1 ? summary.successRate / 100 : summary.successRate;
  }
  if (
    summary.completedRuns != null &&
    summary.totalRuns != null &&
    summary.totalRuns > 0
  ) {
    return summary.completedRuns / summary.totalRuns;
  }
  return null;
}

/**
 * Derive an average cost per run: `totalCostUsd / totalRuns`, guarding
 * divide-by-zero and tolerating a string cost (same `parseFloat` tolerance as
 * `formatCost`). Returns `null` when the inputs are absent or the division is
 * undefined.
 */
export function deriveAvgCost(entry: AgentTypeStat): number | null {
  if (entry.totalCostUsd == null || entry.totalRuns == null || entry.totalRuns === 0) {
    return null;
  }
  const cost =
    typeof entry.totalCostUsd === 'string'
      ? parseFloat(entry.totalCostUsd)
      : entry.totalCostUsd;
  if (!Number.isFinite(cost)) return null;
  return cost / entry.totalRuns;
}

/** Lightweight view-model consumed by `AgentStatsRow`. */
export type AgentRowViewModel = {
  agentType: string;
  label: string;
  runCount: number;
  successRatio: number | null;
  avgCost: number | null;
};

/**
 * Filter zero-run agents, derive per-row metrics, sort by run count descending.
 * Exported so it is unit-testable when a test runner is added.
 */
export function deriveAgentRows(
  byAgentType: AgentTypeStat[] | undefined,
): AgentRowViewModel[] {
  if (!byAgentType || byAgentType.length === 0) return [];

  return byAgentType
    .filter((a) => (a.totalRuns ?? 0) > 0)
    .map((a) => ({
      agentType: a.agentType ?? 'unknown',
      label: formatAgentType(a.agentType),
      runCount: a.totalRuns ?? 0,
      successRatio: deriveSuccessRate(a),
      avgCost: deriveAvgCost(a),
    }))
    .sort((a, b) => b.runCount - a.runCount);
}

// ─── ProjectStats ───────────────────────────────────────────────────────────

export function ProjectStats({ projectId }: { projectId: string }) {
  const { data, isPending, isError, error, refetch, isRefetching } =
    useProjectStats(projectId);
  const theme = useTheme();

  if (isPending) return <Loading message="Loading stats…" />;
  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load stats.'}
        onRetry={refetch}
      />
    );
  }

  const statsData = data as ProjectStatsData | undefined;
  const summary = statsData?.summary;
  const successRatio = summary ? deriveSuccessRate(summary) : null;
  const agentRows = deriveAgentRows(statsData?.byAgentType);

  // Build KPI entries — omit any whose source field is entirely absent.
  const kpis: { label: string; value: string | null }[] = [];

  if (summary?.totalRuns != null) {
    kpis.push({ label: 'Total runs', value: String(summary.totalRuns) });
  }
  if (successRatio != null) {
    kpis.push({ label: 'Success rate', value: formatPercentage(successRatio) });
  }
  if (summary?.totalCostUsd != null) {
    kpis.push({ label: 'Total cost', value: formatCost(summary.totalCostUsd) });
  }
  if (summary?.avgDurationMs != null) {
    kpis.push({ label: 'Avg duration', value: formatDuration(summary.avgDurationMs) });
  }

  // Empty state is content-driven: it fires whenever there is nothing to
  // render (no data, or every contract field absent/renamed) — it does NOT
  // hinge on `totalRuns` alone, the field most likely to be misnamed. The
  // explicit `totalRuns === 0` case keeps the friendly copy for a genuinely
  // brand-new project that reports zero runs.
  if (kpis.length === 0 || summary?.totalRuns === 0) {
    return <EmptyState message="No activity yet." />;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={theme.text}
        />
      }>
      <View style={styles.grid}>
        {kpis.map((kpi) => (
          <View key={kpi.label} style={styles.gridItem}>
            <StatCard label={kpi.label} value={kpi.value} />
          </View>
        ))}
      </View>

      {/* Agent-type breakdown section. */}
      <View style={styles.agentSection}>
        <ThemedText type="smallBold" style={styles.sectionHeading}>
          By agent type
        </ThemedText>
        {agentRows.length > 0 ? (
          <View style={styles.agentList}>
            {agentRows.map((row) => (
              <AgentStatsRow
                key={row.agentType}
                label={row.label}
                runs={`${row.runCount} runs`}
                successRate={formatPercentage(row.successRatio)}
                avgCost={formatCost(row.avgCost)}
              />
            ))}
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No agent activity yet.
          </ThemedText>
        )}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
  },
  agentSection: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeading: {
    marginBottom: Spacing.half,
  },
  agentList: {
    gap: Spacing.two,
  },
});
