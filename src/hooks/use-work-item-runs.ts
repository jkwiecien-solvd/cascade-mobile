/**
 * useWorkItemRuns — typed query hook for a single work item's runs.
 *
 * A thin wrapper over the `workItems` router; mirrors the pattern established
 * by {@link useProjectRuns} / {@link useRun}: leans on end-to-end tRPC
 * inference (no DTOs, no `as` casts — `ai/RULES.md §3`) and org-scopes
 * automatically via the `x-org-context` header.
 *
 * The query is gated on `useOrg().isReady` (org hydration + `auth.me` settled,
 * see `org-context.tsx`) **and** on truthy `projectId` + `workItemId`, so it
 * never fires while route params are still resolving.
 *
 * Procedure: `trpc.workItems.runs` — input `{ projectId, workItemId }` →
 * runs for that work item. Confirmed against
 * `../cascade/src/api/routers/workItems.ts` (`getRunsByWorkItem`).
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useWorkItemRuns(
  projectId: string | undefined,
  workItemId: string | undefined,
) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.workItems.runs.queryOptions({
      projectId: projectId ?? '',
      workItemId: workItemId ?? '',
    }),
    enabled: isReady && !!projectId && !!workItemId,
  });
}
