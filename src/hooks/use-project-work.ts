/**
 * useProjectWork — the project's unified Work view (PRs + work items with run
 * durations), matching cascade-web's project Work page.
 *
 * Wraps `trpc.prs.listUnifiedWithDurations` (same procedure the web Work route
 * uses), org-scoped via `x-org-context` and gated on `useOrg().isReady` + a
 * truthy `projectId`. The procedure returns the full list in one shot (the web
 * paginates client-side), so this is a plain query, not an infinite one.
 *
 * Confirmed against `../cascade/src/api/routers/prs.ts`
 * (`listUnifiedWithDurations` → `listUnifiedWorkWithDurations`).
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useProjectWork(projectId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.prs.listUnifiedWithDurations.queryOptions({ projectId: projectId ?? '' }),
    enabled: isReady && !!projectId,
  });
}
