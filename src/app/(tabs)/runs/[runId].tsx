/**
 * Run detail header — replaces the placeholder with a real header screen that
 * displays the run's agent type as the native header title, a status badge, and
 * optional Work Item / PR links.
 *
 * Data flows through {@link useRun}, gated on `useOrg().isReady` and a truthy
 * `runId`. The screen renders Loading / Error / not-found states via the shared
 * `query-states.tsx` components (same pattern as `projects/index.tsx`).
 *
 * ## Type note
 * `runs.getById`'s output is inferred from the backend `AppRouter` (sibling
 * `../cascade` repo, absent in this checkout). Rendering reads the display
 * fields through {@link RunDetail} — a narrow local view (same cross-repo
 * narrowing idiom as `ProjectListItem` / `RunListItem`) — so the screen stays
 * typed (no `any`) and tolerates optional fields the contract may omit.
 *
 * Field names (`agentType`, `status`, `workItemTitle`, `workItemUrl`,
 * `prNumber`, `prUrl`) match {@link RunListItem} in `run-card.tsx`. Confirm
 * against `../cascade/src/api/routers/runs.ts` in a checkout where `AppRouter`
 * resolves.
 */
import { useState } from 'react';

import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { EmptyState, ErrorState, Loading } from '@/components/query-states';
import { RunDebugAnalysis, type RunDebugAnalysisData } from '@/components/run-debug-analysis';
import { RunLlmCalls } from '@/components/run-llm-calls';
import { RunLogs } from '@/components/run-logs';
import { RunOverview, type RunOverviewData } from '@/components/run-overview';
import { RunSectionTabs, RUN_SECTIONS, type RunSection } from '@/components/run-section-tabs';
import { RunStatusBadge } from '@/components/run-status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useRun } from '@/hooks/use-run';
import { formatAgentType } from '@/lib/relative-time';

/**
 * Narrow view of the `runs.getById` output fields this screen renders.
 * Intersects the overview fields (`RunOverviewData`) with the header-specific
 * fields (agent type, work item / PR links) so the full run object flows to
 * both the header card and the `RunOverview` section without a second cast.
 */
type RunDetail = RunOverviewData &
  RunDebugAnalysisData & {
    agentType?: string;
    workItemTitle?: string;
    workItemUrl?: string;
    prNumber?: number;
    prUrl?: string;
  };

export default function RunDetailScreen() {
  const insets = useSafeAreaInsets();
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { data, isPending, isError, error, refetch } = useRun(runId);
  const run = data as RunDetail | undefined;
  const [section, setSection] = useState<RunSection>('overview');

  const activeSection = RUN_SECTIONS.find((s) => s.key === section) ?? RUN_SECTIONS[0];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: formatAgentType(run?.agentType) }} />

      {isPending ? (
        <Loading message="Loading run…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refetch}
        />
      ) : !run ? (
        <EmptyState message="Run not found." />
      ) : (
        (() => {
          // Header card (status badge + links) and the section tabs are shared
          // chrome. For the long lists (logs / LLM calls) they're handed in so
          // the card scrolls away as the list header and the tabs stay sticky;
          // for the static sections they render in normal flow above the body.
          const headerCard =
            run.status || run.workItemUrl || run.prUrl ? (
              <View style={styles.headerCard}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  {run.status ? (
                    <View style={styles.row}>
                      <RunStatusBadge status={run.status} />
                    </View>
                  ) : null}

                  {run.workItemUrl ? (
                    <ExternalLink href={run.workItemUrl}>
                      <ThemedText type="linkPrimary">
                        {run.workItemTitle ?? 'View work item'}
                      </ThemedText>
                    </ExternalLink>
                  ) : null}

                  {run.prUrl ? (
                    <ExternalLink href={run.prUrl}>
                      <ThemedText type="linkPrimary">
                        {run.prNumber != null ? `PR #${run.prNumber}` : 'View PR'}
                      </ThemedText>
                    </ExternalLink>
                  ) : null}
                </ThemedView>
              </View>
            ) : null;

          const tabs = <RunSectionTabs active={section} onChange={setSection} />;

          return (
            <>
              {/* Persistent gap below the app bar — sticky tabs pin beneath it. */}
              <View style={styles.topSpacer} />

              {section === 'logs' ? (
                <RunLogs runId={run.id} header={headerCard} tabs={tabs} />
              ) : section === 'llm-calls' ? (
                <RunLlmCalls runId={run.id} header={headerCard} tabs={tabs} />
              ) : (
                <>
                  {headerCard}
                  {tabs}
                  <View
                    style={[styles.sectionContent, { paddingBottom: insets.bottom + Spacing.three }]}>
                    {section === 'overview' ? (
                      <RunOverview run={run} />
                    ) : section === 'debug' ? (
                      <RunDebugAnalysis run={run} />
                    ) : (
                      <EmptyState message={activeSection.emptyMessage} />
                    )}
                  </View>
                </>
              )}
            </>
          );
        })()
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSpacer: {
    height: Spacing.three,
  },
  headerCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
});
