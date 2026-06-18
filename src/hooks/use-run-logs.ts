/**
 * useRunLogs — typed query hook for a single run's logs.
 *
 * A thin wrapper over the `runs` router, mirroring {@link useRunLlmCalls}
 * exactly: org-scoped via `x-org-context`, gated on `useOrg().isReady` and a
 * truthy `runId` so it never fires while the route param is still resolving.
 *
 * The logs live on their own procedure (`runs.getLogs`, keyed by `{ runId }`),
 * NOT on `runs.getById` — confirmed against `../cascade/src/api/routers/runs.ts`
 * (`getLogs` → `getRunLogs(runId)` → the `agentRunLogs` row `{ cascadeLog,
 * engineLog }`). This mirrors the web client's `log-viewer.tsx`, which fetches
 * `trpc.runs.getLogs.queryOptions({ runId })`.
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useRunLogs(runId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.runs.getLogs.queryOptions({ runId: runId ?? '' }),
    enabled: isReady && !!runId,
  });
}
