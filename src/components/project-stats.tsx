/**
 * ProjectStats — summary metric grid for a project's Stats section.
 *
 * Owns the {@link useProjectStats} hook (parallels `RunLlmCalls` owning
 * `useRunLlmCalls`) and renders a 2-column grid of {@link StatCard}s for the
 * key KPIs: total runs, success rate, total cost, and average duration. Mirrors
 * the web Stats page's `StatsSummary`. Pull-to-refresh is wired via
 * `RefreshControl`.
 *
 * ## Type note
 * The `prs.workStatsAggregated` procedure returns `{ summary, byAgentType }`;
 * this screen reads the `summary` block. {@link StatsSummary} is a narrow local
 * view of that block (same cross-repo narrowing idiom as `RunListItem` /
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

import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { StatCard } from '@/components/stat-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProjectStats } from '@/hooks/use-project-stats';
import { useTheme } from '@/hooks/use-theme';
import { formatCost, formatDuration, formatPercentage } from '@/lib/relative-time';

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

/** Full procedure output; this screen renders the `summary` block. */
type ProjectStatsData = {
  summary?: StatsSummary;
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

  const summary = (data as ProjectStatsData | undefined)?.summary;
  const successRatio = summary ? deriveSuccessRate(summary) : null;

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
});
