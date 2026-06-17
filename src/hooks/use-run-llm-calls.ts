/**
 * useRunLlmCalls — typed query hook for a single run's LLM calls.
 *
 * A thin wrapper over the `runs` router, mirroring {@link useRun} exactly:
 * org-scoped via `x-org-context`, gated on `useOrg().isReady` and a truthy
 * `runId` so it never fires while the route param is still resolving.
 *
 * NOTE: the exact procedure name (`runs.listLlmCalls`) and its `{ runId }` input
 * are confirmed against `../cascade/src/api/routers/runs.ts`.
 *
 * Fallback: if the backend already embeds the LLM calls on `runs.getById`'s
 * output, delete this hook and have the screen pass `run.llmCalls` straight
 * into the component instead (no second request). Decide this when the contract
 * is visible; do **not** add a backend procedure (`ai/RULES.md §5` — ask before
 * backend changes).
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useRunLlmCalls(runId: string | undefined) {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.runs.listLlmCalls.queryOptions({ runId: runId ?? '' }),
    enabled: isReady && !!runId,
  });
}
