/**
 * useProjectStats — typed query hook for a project's summary statistics.
 *
 * A thin wrapper over the `projects` router; mirrors {@link useProjectRuns}
 * verbatim: `useQuery({ ...trpc.projects.getStats.queryOptions(...) })`.
 * Org-scoping is automatic via the `x-org-context` header (see `trpc.ts`).
 *
 * The query is gated on `useOrg().isReady` (org hydration + `auth.me` settled,
 * see `org-context.tsx`) **and** on a truthy `projectId`, so it never fires
 * with an empty id while the route param is still resolving.
 *
 * NOTE: the exact procedure name (`projects.getStats`) and its `{ projectId }`
 * input follow the contract documented in the implementation plan. Confirm
 * against `../cascade/src/api/routers/projects.ts` when the sibling repo is
 * checked out — the compiler flags any mismatch immediately once `AppRouter`
 * resolves. Plausible alternatives to check: `projects.stats`,
 * `runs.stats`, `stats.forProject`.
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useProjectStats(projectId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.projects.getStats.queryOptions({ projectId: projectId ?? '' }),
    enabled: isReady && !!projectId,
  });
}
