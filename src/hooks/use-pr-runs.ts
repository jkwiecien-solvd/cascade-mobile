/**
 * usePrRuns — typed query hook for a single PR's runs.
 *
 * A thin wrapper over the `prs` router; mirrors the pattern established
 * by {@link useProjectRuns} / {@link useRun}: leans on end-to-end tRPC
 * inference (no DTOs, no `as` casts — `ai/RULES.md §3`) and org-scopes
 * automatically via the `x-org-context` header.
 *
 * The query is gated on `useOrg().isReady` (org hydration + `auth.me` settled,
 * see `org-context.tsx`) **and** on truthy `projectId` + `prNumber`, so it
 * never fires while route params are still resolving.
 *
 * Procedure: `trpc.prs.runs` — input `{ projectId, prNumber }` →
 * runs for that PR. Confirmed against
 * `../cascade/src/api/routers/prs.ts` (`getRunsForPR`).
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function usePrRuns(
  projectId: string | undefined,
  prNumber: number | undefined,
) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.prs.runs.queryOptions({
      projectId: projectId ?? '',
      prNumber: prNumber ?? 0,
    }),
    enabled: isReady && !!projectId && prNumber != null && prNumber > 0,
  });
}
