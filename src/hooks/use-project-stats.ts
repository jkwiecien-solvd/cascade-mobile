/**
 * useProjectStats — typed query hook for a project's summary statistics.
 *
 * Wraps the `prs.workStatsAggregated` procedure (verified against
 * `../cascade/src/api/routers/prs.ts`), which the reference web client uses on
 * its project Stats page (`web/src/routes/projects/$projectId.stats.tsx`).
 * It returns `{ summary, byAgentType }`; this app renders both blocks — the
 * `summary` KPIs in a `StatCard` grid and the `byAgentType` entries as
 * `AgentStatsRow` cards (run count, success rate, average cost per agent type).
 * Org-scoping is automatic via the `x-org-context` header (see `trpc.ts`).
 *
 * The query is gated on `useOrg().isReady` (org hydration + `auth.me` settled,
 * see `org-context.tsx`) **and** on a truthy `projectId`, so it never fires
 * with an empty id while the route param is still resolving.
 *
 * The optional `dateFrom` / `agentType` / `status` inputs are omitted here, so
 * the backend aggregates over the 500 most recent completed/failed/timed-out
 * runs for the project (no client-side time-range or filter controls yet).
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useProjectStats(projectId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.prs.workStatsAggregated.queryOptions({ projectId: projectId ?? '' }),
    enabled: isReady && !!projectId,
  });
}
