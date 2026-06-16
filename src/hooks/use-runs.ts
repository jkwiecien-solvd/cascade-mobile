/**
 * useRuns — typed, org-scoped, cross-project infinite hook for the Runs feed.
 *
 * Mirrors {@link useProjects} / {@link useProjectRuns}: a thin wrapper over the
 * `runs` router that leans on end-to-end `AppRouter` inference (no DTOs, no
 * `any` — `ai/RULES.md §3`) and org-scopes automatically via the
 * `x-org-context` header. Unlike `useProjectRuns` (which always pins a single
 * `{ projectId }`), this lists runs **across all projects** by omitting
 * `projectId` unless the caller filters by one — matching the web home (`/`).
 *
 * ## Paging
 * The original card requirements describe the backend's existing **numbered
 * offset/limit** paging ("infinite scroll / load-more on the same backend
 * paging — replace numbered offset/limit"). The cursor-based
 * `infiniteQueryOptions` proxy does not fit that shape, so we hand-roll
 * `useInfiniteQuery` over the bare {@link trpcClient}, paginating by `offset`
 * and stopping once a page returns fewer than {@link PAGE_SIZE} items.
 *
 * ## Filters
 * `filters` is folded into both the query input **and** the query key, so a
 * filter change produces a fresh key and React Query resets paging to page 1
 * automatically (consumed by the filter UI; harmless when unset). On org switch
 * `org-context.tsx` calls `queryClient.invalidateQueries()`, so this key is
 * invalidated and refetched under the new org like every other query.
 *
 * ## Type note
 * The backend `AppRouter` types live in the sibling `../cascade` repo, which is
 * not present in this checkout, so `runs.list`'s exact input/output is not
 * statically resolved here. The query stays inferred (no `any`); consumers read
 * the rendered fields through a narrow local view (`RunListItem` in
 * `run-card.tsx`), the same cross-repo narrowing idiom used by `org-context.tsx`.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useOrg } from '@/lib/org-context';
import { trpcClient } from '@/lib/trpc';

/** Page size for offset/limit paging. */
export const PAGE_SIZE = 20;

/** Optional cross-project run filters (all single-select, all clearable). */
export type RunFilters = {
  status?: string;
  agentType?: string;
  projectId?: string;
};

/** Build the procedure input, including only the filter keys that are set. */
function buildInput(filters: RunFilters, limit: number, offset: number) {
  const input: Record<string, string | number> = { limit, offset };
  if (filters.status) input.status = filters.status;
  if (filters.agentType) input.agentType = filters.agentType;
  if (filters.projectId) input.projectId = filters.projectId;
  return input;
}

export function useRuns(filters: RunFilters = {}) {
  const { isReady } = useOrg();

  const query = useInfiniteQuery({
    queryKey: ['runs.list', filters],
    queryFn: ({ pageParam }) =>
      // The bare client returns the inferred `runs.list` output (an array page).
      trpcClient.runs.list.query(buildInput(filters, PAGE_SIZE, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    enabled: isReady,
  });

  // Flatten the loaded pages into a single list for the FlatList.
  const runs = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  return {
    runs,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}
