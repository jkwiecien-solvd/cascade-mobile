/**
 * useProjectRuns — typed query hook for one project's runs.
 *
 * A thin wrapper over the `runs` router; like {@link useProjects} it leans on
 * end-to-end tRPC inference (no DTOs, no `as` casts here — `ai/RULES.md §3`) and
 * org-scopes automatically via the `x-org-context` header.
 *
 * The query is gated on `useOrg().isReady` (org hydration + `auth.me` settled,
 * see `org-context.tsx`) **and** on a truthy `projectId`, so it never fires with
 * an empty id while a route param is still resolving.
 *
 * NOTE: the exact procedure name (`runs.list`) and its `{ projectId }` input
 * follow the contract documented in the implementation plan. Confirm against
 * `../cascade/src/api/routers/runs.ts` when the sibling repo is checked out — the
 * compiler flags any mismatch immediately once `AppRouter` resolves.
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useProjectRuns(projectId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.runs.list.queryOptions({ projectId: projectId ?? '' }),
    enabled: isReady && !!projectId,
  });
}
