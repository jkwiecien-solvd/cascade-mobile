import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

import type { AppRouter } from '../../../cascade/src/api/router';

import { API_URL } from './api';
import { queryClient } from './query-client';

type Getter<T> = () => T;

// Header-injection seams. Both default to `null` and are filled in by other
// cards: the auth card registers a cookie getter once login has captured a
// session cookie; the org-context card registers the org-id getter once a
// user is signed in.
let orgContextGetter: Getter<string | null> | null = null;
let cookieGetter: Getter<string | null> | null = null;

/**
 * Register a callback returning the current org id, or `null` when the user
 * has no active org. The result is sent on every request as `x-org-context`.
 *
 * Called by the org-context layer after sign-in and on org switch.
 */
export function setOrgContextGetter(getter: Getter<string | null>): void {
  orgContextGetter = getter;
}

/**
 * Register a callback returning a serialized `Cookie:` header value, or
 * `null` when no session cookie has been captured yet.
 *
 * Called by the auth layer after login persists the `Set-Cookie` returned by
 * `POST /api/auth/login`. The backend authenticates purely from this cookie;
 * see `ai/RULES.md §4` for the rationale.
 */
export function setCookieGetter(getter: Getter<string | null>): void {
  cookieGetter = getter;
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers() {
        const headers: Record<string, string> = {};
        const orgId = orgContextGetter?.();
        if (orgId) headers['x-org-context'] = orgId;
        const cookie = cookieGetter?.();
        if (cookie) headers['Cookie'] = cookie;
        return headers;
      },
    }),
  ],
});

/**
 * Typed tRPC proxy bound to the singleton React Query client.
 *
 * Consume via hooks, e.g.
 *
 * ```ts
 * const { data } = useQuery(trpc.auth.me.queryOptions());
 * ```
 *
 * All input/output types flow from the backend `AppRouter`; do not hand-roll
 * DTOs for these calls.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
