/**
 * useProjects — typed query hook for the org-scoped projects list.
 *
 * A thin wrapper over `trpc.projects.list.queryOptions()`; the input and output
 * types flow end-to-end from the backend `AppRouter` (no hand-rolled DTOs, no
 * `as` casts here — see `ai/RULES.md §3`). `projects.list` takes no input today;
 * org scoping is applied automatically via the `x-org-context` header registered
 * by `org-context.tsx`.
 *
 * The query is gated on `useOrg().isReady` so the first request only fires once
 * the persisted org selection has hydrated and `auth.me` has settled — mirroring
 * the readiness concept in `org-context.tsx`. This guarantees the request is
 * correctly org-scoped from the start instead of racing org hydration.
 */
import { useQuery } from '@tanstack/react-query';

import { useOrg } from '@/lib/org-context';
import { trpc } from '@/lib/trpc';

export function useProjects() {
  const { isReady } = useOrg();

  return useQuery({
    ...trpc.projects.list.queryOptions(),
    enabled: isReady,
  });
}
