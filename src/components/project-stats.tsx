/**
 * ProjectStats — summary metric grid for a project's Stats section.
 *
 * Owns the {@link useProjectStats} hook (parallels `RunLlmCalls` owning
 * `useRunLlmCalls`) and renders a 2-column grid of {@link StatCard}s for the
 * key KPIs: total runs, success rate, total cost, average duration, and active
 * runs. Pull-to-refresh is wired via `RefreshControl`.
 *
 * ## Type note
 * {@link ProjectStatsData} is a narrow local view (same cross-repo narrowing
 * idiom as `RunListItem` / `RunOverviewData`); every field but `projectId` is
 * optional so missing/renamed contract fields render blank, never crash.
 *
 * Caveat (same as `run-overview.tsx`): because the consumer casts and every
 * field is optional, a *misnamed* field is NOT a compile error — it simply
 * renders blank. These names must be confirmed against
 * `../cascade/src/api/routers/projects.ts` in a checkout where `AppRouter`
 * resolves.
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
 * Narrow view of the fields this component renders.
 * Every field but `projectId` is optional so missing/renamed contract fields
 * render blank, never crash (same idiom as `RunOverviewData`).
 *
 * Field names are unverified — confirm against
 * `../cascade/src/api/routers/projects.ts` when the sibling repo is present.
 */
type ProjectStatsData = {
  projectId: string;
  totalRuns?: number;
  succeededRuns?: number;
  failedRuns?: number;
  successRate?: number;
  totalCostUsd?: number | string;
  avgDurationMs?: number;
  runningRuns?: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive a success-rate ratio (0–1) tolerantly:
 * - Use `successRate` when present (normalize: if > 1, treat as percentage
 *   and divide by 100).
 * - Fall back to `succeededRuns / totalRuns` when both are present.
 * - Return `null` otherwise.
 */
function deriveSuccessRate(stats: ProjectStatsData): number | null {
  if (stats.successRate != null && Number.isFinite(stats.successRate)) {
    // Normalize: if > 1, assume the backend sent a percentage (e.g. 95)
    return stats.successRate > 1 ? stats.successRate / 100 : stats.successRate;
  }
  if (
    stats.succeededRuns != null &&
    stats.totalRuns != null &&
    stats.totalRuns > 0
  ) {
    return stats.succeededRuns / stats.totalRuns;
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

  const stats = data as ProjectStatsData | undefined;

  if (!stats || stats.totalRuns === 0) {
    return <EmptyState message="No activity yet." />;
  }

  const successRatio = deriveSuccessRate(stats);

  // Build KPI entries — omit any whose source field is entirely absent.
  const kpis: { label: string; value: string | null }[] = [];

  if (stats.totalRuns != null) {
    kpis.push({ label: 'Total runs', value: String(stats.totalRuns) });
  }
  if (successRatio != null) {
    kpis.push({ label: 'Success rate', value: formatPercentage(successRatio) });
  }
  if (stats.totalCostUsd != null) {
    kpis.push({ label: 'Total cost', value: formatCost(stats.totalCostUsd) });
  }
  if (stats.avgDurationMs != null) {
    kpis.push({ label: 'Avg duration', value: formatDuration(stats.avgDurationMs) });
  }
  if (stats.runningRuns != null) {
    kpis.push({ label: 'Active runs', value: String(stats.runningRuns) });
  }

  if (kpis.length === 0) {
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
