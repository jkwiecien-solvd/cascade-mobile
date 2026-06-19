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
 * NOTE — UNVERIFIED PROCEDURE NAME. The exact procedure name
 * (`projects.getStats`) and its `{ projectId }` input could NOT be verified in
 * this checkout because the sibling `../cascade` repo is absent (so `AppRouter`
 * does not resolve here). The narrow-local-type "renders blank, never crash"
 * idiom in `project-stats.tsx` only protects *output field names* — it does
 * **not** cover this procedure name. Confirm against
 * `../cascade/src/api/routers/projects.ts` in a full checkout before merge
 * (RULES.md §5: do not guess procedure names). Plausible alternatives if the
 * name is wrong: `projects.stats`, `runs.stats`, `stats.forProject`.
 *
 * Failure modes if the name/input is wrong:
 * - Compile time (once `AppRouter` resolves): a hard TS error on
 *   `trpc.projects.getStats` — this is the intended loud verification gate.
 * - Runtime: tRPC throws, which surfaces through the hook's `isError` branch as
 *   `ProjectStats`'s `ErrorState` (not a crash, but not a graceful blank).
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
