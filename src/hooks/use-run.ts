/**
 * useRun — typed query hook for a single run's detail.
 *
 * A thin wrapper over the `runs` router; like {@link useProjectRuns} it leans on
 * end-to-end tRPC inference (no DTOs, no `as` casts here — `ai/RULES.md §3`) and
 * org-scopes automatically via the `x-org-context` header.
 *
 * The query is gated on `useOrg().isReady` (org hydration + `auth.me` settled,
 * see `org-context.tsx`) **and** on a truthy `runId`, so it never fires with
 * an empty id while the route param is still resolving.
 *
 * NOTE: the exact procedure name (`runs.get`) and its `{ runId }` input
 * follow the contract documented in the implementation plan. Confirm against
 * `../cascade/src/api/routers/runs.ts` when the sibling repo is checked out — the
 * compiler flags any mismatch immediately once `AppRouter` resolves.
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useRun(runId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.runs.get.queryOptions({ runId: runId ?? '' }),
    enabled: isReady && !!runId,
  });
}
