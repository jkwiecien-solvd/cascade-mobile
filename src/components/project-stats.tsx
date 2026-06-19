/**
 * ProjectStats — summary metric grid + per-agent-type charts for a project's
 * Stats section.
 *
 * Owns the {@link useProjectStats} hook (parallels `RunLlmCalls` owning
 * `useRunLlmCalls`) and renders:
 * 1. A 2-column grid of {@link StatCard}s for the key KPIs: total runs, success
 *    rate, total cost, and average duration (mirrors the web Stats page's
 *    `StatsSummary`).
 * 2. A "By agent type" section with two charts, ported from the web client:
 *    a {@link CostPieChart} (cost share by agent type) and a
 *    {@link DurationBarChart} (total duration by agent type).
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
 * Field names are verified against the `AgentTypeBreakdown` / summary shapes in
 * `../cascade/src/db/repositories/runStatsRepository.ts`
 * (`getProjectWorkStatsAggregated`). NOTE: each `byAgentType` entry exposes
 * `runCount` / `totalCostUsd` / `totalDurationMs` / `avgDurationMs` — it does
 * **not** carry per-agent `completedRuns`/`successRate` (those exist only on
 * `summary`), so there is no per-agent success-rate breakdown. The web client
 * likewise charts only cost and duration by agent type.
 */
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { CostPieChart, type CostSlice } from '@/components/charts/cost-pie-chart';
import { DurationBarChart, type DurationBar } from '@/components/charts/duration-bar-chart';
import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAgentColor } from '@/lib/chart-colors';
import { useProjectStats } from '@/hooks/use-project-stats';
import { useTheme } from '@/hooks/use-theme';
import { formatAgentType, formatCost, formatDuration, formatPercentage } from '@/lib/relative-time';

// ─── Narrow local types ───────────────────────────────────────────────────────

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
 * Narrow view of one element in the `byAgentType` array (the backend's
 * `AgentTypeBreakdown`). Field names verified against `runStatsRepository.ts`:
 * the per-agent entry carries `runCount` (NOT `totalRuns`), `totalCostUsd`
 * (string), and `totalDurationMs`; it has no per-agent success data. Every
 * field is optional — the established "missing field → blank, never crash"
 * idiom.
 */
type AgentTypeStat = {
  agentType?: string;
  runCount?: number;
  totalCostUsd?: number | string;
  totalDurationMs?: number;
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

/** Parse a numeric or string cost into a finite number, or `null`. */
function parseCost(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : null;
}

/** Normalized per-agent row used to build both charts. */
export type AgentBreakdownRow = {
  agentType: string;
  label: string;
  runCount: number;
  totalCostUsd: number;
  totalDurationMs: number;
};

/**
 * Normalize the `byAgentType` block into chart-ready rows, tolerating absent /
 * string-typed fields. Cost defaults to 0 (not null) so it can be summed and
 * filtered uniformly; per-chart filtering of zero values happens at render.
 * Exported so it is unit-testable when a test runner is added.
 */
export function deriveAgentBreakdown(
  byAgentType: AgentTypeStat[] | undefined,
): AgentBreakdownRow[] {
  if (!byAgentType || byAgentType.length === 0) return [];

  return byAgentType.map((a) => ({
    agentType: a.agentType ?? 'unknown',
    label: formatAgentType(a.agentType),
    runCount: a.runCount ?? 0,
    totalCostUsd: parseCost(a.totalCostUsd) ?? 0,
    totalDurationMs: typeof a.totalDurationMs === 'number' && a.totalDurationMs > 0
      ? a.totalDurationMs
      : 0,
  }));
}

// ─── ProjectStats ───────────────────────────────────────────────────────────

export function ProjectStats({ projectId }: { projectId: string }) {
  const { data, isPending, isError, error, refetch, isRefetching } =
    useProjectStats(projectId);
  const theme = useTheme();
  const agentColor = useAgentColor();

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
  const breakdown = deriveAgentBreakdown(statsData?.byAgentType);

  // Cost slices: positive cost only, largest share first.
  const costSlices: CostSlice[] = breakdown
    .filter((r) => r.totalCostUsd > 0)
    .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
    .map((r) => ({
      key: r.agentType,
      label: r.label,
      value: r.totalCostUsd,
      color: agentColor(r.agentType),
      display: formatCost(r.totalCostUsd) ?? '$0.00',
    }));
  const totalCost = costSlices.reduce((sum, s) => sum + s.value, 0);

  // Duration bars: positive duration only, longest first (matches web).
  const durationBars: DurationBar[] = breakdown
    .filter((r) => r.totalDurationMs > 0)
    .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
    .map((r) => ({
      key: r.agentType,
      label: r.label,
      value: r.totalDurationMs,
      color: agentColor(r.agentType),
      display: formatDuration(r.totalDurationMs) ?? '',
    }));

  const hasCharts = costSlices.length > 0 || durationBars.length > 0;

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

      {/* Agent-type charts. */}
      <View style={styles.agentSection}>
        {hasCharts ? (
          <View style={styles.charts}>
            {costSlices.length > 0 ? (
              <View style={styles.chartBlock}>
                <ThemedText type="smallBold" style={styles.chartTitle}>
                  Cost by agent type
                </ThemedText>
                <CostPieChart slices={costSlices} totalDisplay={formatCost(totalCost) ?? '$0.00'} />
              </View>
            ) : null}
            {durationBars.length > 0 ? (
              <View style={styles.chartBlock}>
                <ThemedText type="smallBold" style={styles.chartTitle}>
                  Duration by agent type
                </ThemedText>
                <DurationBarChart bars={durationBars} />
              </View>
            ) : null}
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
  charts: {
    gap: Spacing.four,
  },
  chartBlock: {
    gap: Spacing.two,
  },
  chartTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
});
