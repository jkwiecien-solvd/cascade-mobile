# Cascade Mobile

A React Native (Expo) mobile client for **[Cascade](https://github.com/mongrel-intelligence/cascade)** — the open-source platform that orchestrates AI agents (Claude Code, Codex, opencode, LLMist) across software-development workflows in GitHub, Trello, Jira, and Linear.

This app is a thin client of Cascade's **Dashboard API** — the same tRPC API the existing `web/` dashboard consumes. It reuses the backend's `AppRouter` type for end-to-end type safety, so screens are built against the real server contract with no hand-written DTOs.

> **Status:** scaffolded with auth wired. The Expo project, navigation, Cascade integration dependencies, the foundational tRPC + React Query data layer ([`src/lib/`](./src/lib/)), and the **auth flow** (login → cookie persistence → session bootstrap → logout, in [`src/lib/auth/`](./src/lib/auth/) + [`src/app/login.tsx`](./src/app/login.tsx)) are in place. Feature screens are not yet wired up — see [Next steps](#next-steps).

---

## What it does (planned)

A read-and-act companion for the Cascade web dashboard, on mobile:

- Sign in against a Cascade deployment
- Browse projects and their work items
- Monitor agent **runs** (planning, implementation, review, debug, …)
- View pull requests Cascade has opened and their review status
- Switch organization context (superadmins)

The full agent catalogue and concepts live in the [backend README](../cascade/README.md) and [CLAUDE.md](../cascade/CLAUDE.md).

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK **56**, React Native **0.85**, React **19.2** |
| Architecture | New Architecture (default), React Compiler enabled |
| Navigation | **Expo Router** (file-based, typed routes) — `src/app/` |
| Language | TypeScript **6** (strict) |
| Data layer | **@tanstack/react-query v5** + **@trpc/client v11** + **@trpc/tanstack-react-query v11** |
| Backend contract | imports `AppRouter` from `../cascade/src/api/router.ts` |
| Secure storage | **expo-secure-store** (session/credentials) |
| Cookies | **@react-native-cookies/cookies** (session-cookie persistence — see below) |

Path alias: `@/*` → `./src/*` (and `@/assets/*` → `./assets/*`).

---

## Backend integration

The app talks **only** to the Cascade **Dashboard API** (Hono + tRPC v11), which runs on `:3001` in local development.

- **API:** tRPC at `/trpc`. The router type is `AppRouter` (`../cascade/src/api/router.ts`). Mirror the web client's setup in [`web/src/lib/trpc.ts`](../cascade/web/src/lib/trpc.ts) — `createTRPCClient` + `createTRPCOptionsProxy` over `httpBatchLink`.
- **Auth:** `POST /api/auth/login` with `{ email, password }`. On success the server sets an **httpOnly** `cascade_session` cookie (30-day session) and returns `{ id, email, name, role }`. `POST /api/auth/logout` clears it. The server resolves the user **only from the cookie** — there is no `Authorization: Bearer` path today.
- **Org scoping:** requests carry an `x-org-context` header. Superadmins can switch orgs; members are pinned to their own.
- **Auth state:** `auth.me` (protected tRPC query) returns the current user, effective org, and (for superadmins) the available orgs.

### ⚠️ The cookie gotcha

React Native's `fetch` does **not** persist cookies across requests like a browser does. Because the backend reads the session **only** from the `cascade_session` cookie, the app must persist and re-send it manually via **@react-native-cookies/cookies** (already installed). Plan the auth layer around this from the start.

> In non-production the cookie is named `cascade_session_<NODE_ENV>` (e.g. `cascade_session_development`) — don't hard-code the name; let the cookie jar carry whatever the server set.

---

## Getting started

**Prerequisites:** Node.js, a running Cascade Dashboard API (see the [backend dev guide](../cascade/README.md#-development)), the cascade repo checked out **as a sibling** of this one (`../cascade`), and Xcode/Android Studio or Expo Go.

```bash
npm install
npm start          # Expo dev server — then press i / a, or scan with Expo Go
# or target a platform directly:
npm run ios
npm run android
npm run web
```

`npm run lint` runs `expo lint`. Type-checking (`npx tsc --noEmit`) requires the sibling cascade checkout — see [Cross-repo type dependency](#cross-repo-type-dependency).

### Configuring the API base URL

The app reads the Dashboard API base URL from `EXPO_PUBLIC_API_URL` (Expo inlines this at build time):

| Target | Value |
|---|---|
| iOS simulator | `http://localhost:3001` (default — no override needed) |
| Android emulator | `http://10.0.2.2:3001` (default — no override needed) |
| Physical device | `http://<YOUR_LAN_IP>:3001` ← **required**, cannot be auto-detected |

Copy `.env.local.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to the LAN IP of the machine running the Dashboard API when you're on a real device. The platform defaults live in [`src/lib/api.ts`](./src/lib/api.ts).

### Cross-repo type dependency

[`src/lib/trpc.ts`](./src/lib/trpc.ts) imports the backend's `AppRouter` as a **type only** from `../../cascade/src/api/router` (the single deliberate exception to the no-relative-imports rule — see [`ai/RULES.md` §3](./ai/RULES.md)). Zero runtime crosses the repo boundary.

For this to type-check, the cascade repo must be reachable at the resolved path. If `npx tsc --noEmit` reports `Cannot find module '../../cascade/src/api/router'`, check out the cascade repo so that file is present, or provide a local `AppRouter` stub `.d.ts` (only needed for isolated checkouts without the backend repo).

---

## Project structure

```
src/
  app/            # Expo Router routes (file-based). Entry: expo-router/entry
    _layout.tsx   # Root layout: providers + <Stack> + auth gate (redirects to /runs)
    login.tsx     # Unauthenticated login screen (outside the tab group)
    (tabs)/       # Authenticated app — native bottom tabs (URL-transparent group)
      _layout.tsx # Renders the native tab bar (AppTabs)
      runs/       # Runs tab (default) — own Stack: cross-project card feed + [runId] detail (placeholder)
      projects/   # Projects tab — own Stack: list, [projectId] (sections), [projectId]/[section]
      settings/   # Settings tab — own Stack: General (account + sign-out), users
      global/     # Global tab (superadmin only) — own Stack + guard: hub + 4 admin placeholders
  components/     # Reusable UI (app-tabs[.web], org-switcher[-header], logout-button, run-status-badge, query-states, run-card, run-llm-calls, live-duration, filter-chips, runs-filter-sheet)
  constants/      # theme, etc.
  hooks/          # color scheme, theme, use-projects, use-project-runs, use-runs, use-run, use-run-llm-calls
  lib/            # API client, query client, auth helpers (mirrors web/src/lib/)
    api.ts        # API_URL (platform-aware, EXPO_PUBLIC_API_URL override)
    query-client.ts  # singleton React Query client
    trpc.ts       # typed tRPC client + org-context / cookie getter seams
    org-context.tsx  # OrgProvider/useOrg — effective org + superadmin switch
    org-storage.ts   # persisted org selection (expo-secure-store; .web.ts → localStorage)
    auth/         # cookie jar, auth service, AuthProvider/useAuth, barrel
      cookie-jar.ts     # @react-native-cookies/cookies + expo-secure-store
      auth-service.ts   # login/logout (fetch) + AuthUser / AuthError
      auth-provider.tsx # <AuthProvider> + useAuth() state machine
      index.ts          # public barrel
ai/
  RULES.md        # System prompt / working rules for AI agents on this repo
```

---

## Working with AI agents

This repo is built with AI agents. Before any code is written, read:

- **[ai/RULES.md](./ai/RULES.md)** — the single source of truth: system prompt and conventions for agents working in this codebase (including the Expo SDK 56 rule — consult the **exact versioned docs** at <https://docs.expo.dev/versions/v56.0.0/>). `CLAUDE.md` and `GEMINI.md` point here.

---

## Next steps

The login/cookie flow is now wired: [`src/lib/auth/`](./src/lib/auth/) captures and persists the session cookie (registering `setCookieGetter` from [`src/lib/trpc.ts`](./src/lib/trpc.ts)), bootstraps the session on launch via `auth.me`, and gates routing between [`src/app/login.tsx`](./src/app/login.tsx) and the authenticated `src/app/(tabs)/` group.

The org-context layer is now wired: [`src/lib/org-context.tsx`](./src/lib/org-context.tsx) registers `setOrgContextGetter` from [`src/lib/trpc.ts`](./src/lib/trpc.ts), derives the effective org from `auth.me` (members are pinned to their own org; superadmins may switch), persists a superadmin's choice via `expo-secure-store` (with a `localStorage` web split in [`src/lib/org-storage.ts`](./src/lib/org-storage.ts)), and invalidates React Query on switch. The superadmin-only switcher lives in [`src/components/org-switcher.tsx`](./src/components/org-switcher.tsx) and self-hides for members.

The navigation IA is now built on **native bottom tabs** ([`src/components/app-tabs.tsx`](./src/components/app-tabs.tsx), with web parity in [`app-tabs.web.tsx`](./src/components/app-tabs.web.tsx)): **Runs** (default), **Projects**, **Settings**, and a superadmin-only **Global** hub, each backed by its own nested `Stack` under [`src/app/(tabs)/`](./src/app/(tabs)/) so deep screens push independently per tab. Projects is now a first-class tab — its list still drills into a project, whose detail is a **sections list** (General, Engine, Integrations, Agents, Lifecycle, Work, Stats) pushing generic section placeholders. The org switcher moved into a header-right control ([`src/components/org-switcher-header.tsx`](./src/components/org-switcher-header.tsx)) reachable from every tab, and account info + sign-out live in Settings. The Global tab is gated on `useIsSuperadmin()` ([`src/lib/auth/use-is-superadmin.ts`](./src/lib/auth/use-is-superadmin.ts), reading the `auth.me` `role`).

Projects data still flows through thin typed hooks ([`src/hooks/use-projects.ts`](./src/hooks/use-projects.ts), [`src/hooks/use-project-runs.ts`](./src/hooks/use-project-runs.ts)) that wrap `trpc.projects.list` / `trpc.runs.list`, gate on `useOrg().isReady`, and rely on end-to-end `AppRouter` inference (no hand-written DTOs), reusing shared loading / empty / error views ([`src/components/query-states.tsx`](./src/components/query-states.tsx)) and a status pill ([`src/components/run-status-badge.tsx`](./src/components/run-status-badge.tsx)).

The **Runs feed is now wired** (no longer an IA placeholder): the Runs tab renders a mobile-native, cross-project card list via the new org-scoped infinite hook [`src/hooks/use-runs.ts`](./src/hooks/use-runs.ts) (wraps `trpc.runs.list`, offset/limit paging through the now-exported bare `trpcClient`, optional status/agent-type/project filters folded into the query key). Each run is a [`RunCard`](./src/components/run-card.tsx) (agent type + status badge → project / work item → relative-time · duration · cost · iterations · PR link), with a live-ticking elapsed time for running runs via [`LiveDuration`](./src/components/live-duration.tsx) and pure formatting helpers in [`src/lib/relative-time.ts`](./src/lib/relative-time.ts). Filtering uses a Modal bottom sheet ([`src/components/runs-filter-sheet.tsx`](./src/components/runs-filter-sheet.tsx)) of reusable [`FilterChips`](./src/components/filter-chips.tsx), opened from a header-right trigger composed next to the org switcher.

The **run detail's LLM Calls section** is now wired: switching to the LLM Calls tab on a run detail renders [`RunLlmCalls`](./src/components/run-llm-calls.tsx), an expandable-list component backed by [`useRunLlmCalls`](./src/hooks/use-run-llm-calls.ts). Each call shows a collapsed model/tokens/cost summary and expands to full detail. Two new pure formatting helpers (`formatTokens`, `formatLlmCost`) in [`src/lib/relative-time.ts`](./src/lib/relative-time.ts) handle comma-grouped token counts and sub-cent cost display.

The Settings / Global screens still ship as navigation-ready IA placeholders; their feature content (user management, global admin) builds on this path in follow-up cards. See the end of [ai/RULES.md](./ai/RULES.md) for detail.

## License

MIT (see [LICENSE](./LICENSE)).
