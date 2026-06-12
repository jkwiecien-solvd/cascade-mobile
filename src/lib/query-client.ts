import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton React Query client for the app.
 *
 * Defaults mirror the cascade web reference (`../cascade/web/src/lib/`):
 *  - `staleTime: 30s` — avoid refetching the same data on every screen mount.
 *  - `retry: 1` — one automatic retry; surface errors to the user quickly so
 *    they can act, instead of looping silently.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
