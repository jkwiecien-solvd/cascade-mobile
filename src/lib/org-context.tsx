/**
 * OrgProvider + useOrg — the org-context layer that scopes every request to an
 * organization via the `x-org-context` header.
 *
 * ## How it wires into the request path
 * `src/lib/trpc.ts` already injects `x-org-context` on every request from a
 * single getter registered through `setOrgContextGetter`. This module registers
 * that getter **once at import time**, backed by a synchronous module-level ref
 * ({@link currentOrgId}) so the synchronous tRPC `headers()` callback can read
 * the active org without awaiting React state or storage.
 *
 * ## Effective-org state machine
 *   1. The only React state is the user's *explicit selection* (`selectedOrgId`),
 *      hydrated from `org-storage` on mount and updated by `switchOrg`.
 *   2. The {@link OrgState.effectiveOrgId} is **derived during render** by clamping
 *      that selection against `auth.me`: a superadmin keeps a selection only while
 *      it is still in `availableOrgs`, otherwise it falls back to the server's
 *      `effectiveOrgId`; a member is always pinned to their own org. Deriving in
 *      render (instead of reconciling via `setState` in an effect) keeps the
 *      provider React-Compiler-clean.
 *   3. A side-effect-only effect mirrors the derived value into {@link currentOrgId}
 *      so member requests also carry their org id and every request stays in sync.
 *   4. `switchOrg` (superadmin only) updates the ref synchronously, sets the
 *      selection, persists it, then invalidates React Query so org-scoped data
 *      refetches under the new org.
 *
 * ## Auth dependency
 * `auth.me` is a protected query that needs the session cookie captured by the
 * auth layer (`src/lib/auth/`). The query is gated with `enabled` on the auth
 * status so it never fires while unauthenticated/bootstrapping; until then the
 * layer stays inert (no `availableOrgs`, switcher hidden, header stays `null`).
 *
 * ## Type note
 * The backend `AppRouter` types live in the sibling `../cascade` repo, which is
 * not present in this checkout, so `auth.me`'s output is not statically resolved
 * here. We read the org-relevant fields through a narrow local view
 * ({@link OrgMeContext}) — mirroring how `auth-provider.tsx` narrows the same
 * query — rather than reaching for `any`. These field names match the contract
 * in `ai/RULES.md §4` (`auth.me` → user + `effectiveOrgId` + superadmin
 * `availableOrgs`).
 *
 * React Compiler is enabled (`app.json`), so the module ref is only mutated in
 * effects/handlers, never during render.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './auth';
import { clearStoredOrgId, getStoredOrgId, setStoredOrgId } from './org-storage';
import { setOrgContextGetter, trpc } from './trpc';

/** A switchable organization as surfaced by `auth.me.availableOrgs`. */
export type OrgSummary = { id: string; name: string };

/**
 * Synchronous module-level holder for the active org id. Registered with
 * `setOrgContextGetter` at import time and read on every tRPC request. `null`
 * means "no active org" (header omitted → backend falls back to the user's
 * default org). Mutated only from effects/handlers, never during render.
 */
let currentOrgId: string | null = null;
setOrgContextGetter(() => currentOrgId);

/** Narrow view of the org-relevant fields on the `auth.me` output. */
type OrgMeContext = {
  effectiveOrgId: string | null;
  availableOrgs?: OrgSummary[];
};

export type OrgState = {
  /** The org id scoping requests right now, or `null` before it is known. */
  effectiveOrgId: string | null;
  /** Orgs the current user may switch between (empty for members). */
  availableOrgs: OrgSummary[];
  /** Whether the current user can switch orgs. */
  isSuperadmin: boolean;
  /** Switch the active org (superadmin only). No-op for an unknown org id. */
  switchOrg: (orgId: string) => Promise<void>;
  /** True once persistence has hydrated and `auth.me` has settled (or is idle). */
  isReady: boolean;
};

const OrgContext = createContext<OrgState | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';
  const queryClient = useQueryClient();

  // Shares the cache key with the auth bootstrap's imperative `auth.me` fetch,
  // so this reads the already-loaded session context once authenticated.
  // TODO(org-context): `enabled` is tied to the auth status today; revisit if
  // the auth card exposes a finer-grained "session ready" signal.
  const me = useQuery({
    ...trpc.auth.me.queryOptions(),
    enabled: isAuthenticated,
  });
  const meData = me.data as OrgMeContext | undefined;

  // Stable array reference so the derived `useMemo`s below don't recompute (and
  // the context value doesn't change identity) on every render.
  const availableOrgs = useMemo<OrgSummary[]>(() => meData?.availableOrgs ?? [], [meData]);
  const isSuperadmin = availableOrgs.length > 0;
  const defaultOrgId = meData?.effectiveOrgId ?? null;

  // The user's explicit selection (superadmin choice). `null` until hydrated or
  // chosen; clamped against `availableOrgs` when derived into the effective org.
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the persisted selection once on mount. setState here runs inside an
  // async callback (not synchronously in the effect body), which is intentional.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getStoredOrgId();
      if (cancelled) return;
      if (stored) setSelectedOrgId(stored);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive the effective org by clamping the selection against `auth.me`.
  const effectiveOrgId = useMemo<string | null>(() => {
    if (!isAuthenticated) return null;
    // Before the session context loads, optimistically carry the stored choice
    // (warm start) so the first data request is already org-scoped.
    if (!meData) return selectedOrgId;
    if (isSuperadmin) {
      const selectionIsValid =
        selectedOrgId != null && availableOrgs.some((org) => org.id === selectedOrgId);
      return selectionIsValid ? selectedOrgId : defaultOrgId;
    }
    // Members are always pinned to their own org.
    return defaultOrgId;
  }, [isAuthenticated, meData, isSuperadmin, selectedOrgId, defaultOrgId, availableOrgs]);

  // Mirror the derived value into the synchronous module ref read by tRPC. This
  // effect only updates an external system (the ref) — no React state.
  useEffect(() => {
    currentOrgId = effectiveOrgId;
  }, [effectiveOrgId]);

  // On logout, clear the persisted selection and reset the in-memory choice so a
  // different user signing in on the same session doesn't inherit it. The reset
  // runs after the async storage clear (not synchronously in the effect body).
  useEffect(() => {
    if (status !== 'unauthenticated') return;
    let cancelled = false;
    void (async () => {
      await clearStoredOrgId();
      if (!cancelled) setSelectedOrgId(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const switchOrg = useCallback(
    async (orgId: string) => {
      // Ignore an org the user is not allowed to switch to.
      if (!availableOrgs.some((org) => org.id === orgId)) return;

      // Order matters: ref (sync header) → state (UI) → refetch → persistence.
      // The ref is set here (in a handler) so the invalidation's refetch already
      // carries the new org id, before the mirror effect runs.
      currentOrgId = orgId;
      setSelectedOrgId(orgId);
      // Invalidate (not reset) so the UI stays mounted and active queries —
      // including `auth.me` — refetch under the new org id. Matches the web
      // reference client's switch behavior. Run this before persistence so a
      // failing secure-store write can't strand the UI on un-refetched data —
      // the session-local switch still takes full effect either way.
      await queryClient.invalidateQueries();
      await setStoredOrgId(orgId);
    },
    [availableOrgs, queryClient],
  );

  const isReady = hydrated && (!isAuthenticated || me.isSuccess || me.isError);

  const value = useMemo<OrgState>(
    () => ({ effectiveOrgId, availableOrgs, isSuperadmin, switchOrg, isReady }),
    [effectiveOrgId, availableOrgs, isSuperadmin, switchOrg, isReady],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/**
 * Access the org-context state machine. Throws if used outside
 * {@link OrgProvider}.
 */
export function useOrg(): OrgState {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an <OrgProvider>');
  }
  return context;
}
