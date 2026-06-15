# Cascade Mobile — Agent Rules

System prompt and working conventions for AI agents in this repository. Read this in full before writing code. It complements (does not replace) the root [`AGENTS.md`](../AGENTS.md).

---

## 0. The one rule that overrides everything

**Expo SDK 56 changed substantially. Do not write code from memory.** Before using any Expo / React Native / Expo Router API, read the **exact versioned docs**: <https://docs.expo.dev/versions/v56.0.0/>. If you cannot verify an API against those docs, say so rather than guessing. Patterns from SDK ≤53, the old `app/` (root) layout, or pre–New-Architecture RN are likely wrong here.

---

## 1. What this project is

**Terminology — read first:**
- **"cascade"** = the main project, the web/backend platform, located at **`../cascade`** (sibling directory). It is the source of truth for the API contract, types, and concepts. When these rules say "cascade", they mean `../cascade`.
- **"cascade mobile"** = *this* repository (`cascade-mobile`) — the React Native client we are building. It is a downstream consumer of cascade, never the other way around.

A React Native mobile client for **cascade**, an AI-agent orchestration platform. Cascade drives software work items from plan to merge across GitHub + a PM tool (Trello/Jira/Linear). This app is a **mobile dashboard client** — it does not run agents or talk to providers directly. It talks to **one** thing: cascade's **Dashboard API**.

The main project (cascade) lives at **`../cascade`**. Read it as the source of truth for the API contract. Key references:
- `../cascade/src/api/router.ts` — the root `AppRouter` (exported type). This is what we import for type safety.
- `../cascade/src/api/routers/*` — individual procedure definitions (inputs/outputs).
- `../cascade/src/dashboard.ts` — the Hono server: auth routes + tRPC mount + context creation.
- `../cascade/web/src/lib/` — the **reference web client**. When in doubt about how to consume the API, copy the web app's approach and adapt it to React Native.
- `../cascade/README.md` and `../cascade/CLAUDE.md` — concepts, agent types, architecture.

---

## 2. Tech stack — pinned, do not drift

| Area | Package / version | Notes |
|---|---|---|
| Runtime | Expo SDK `~56`, React Native `0.85.x`, React `19.2.x` | New Architecture on; React Compiler enabled (`app.json` → `experiments.reactCompiler`). |
| Navigation | `expo-router` `~56` | File-based routing under `src/app/`. Typed routes enabled. |
| Language | TypeScript `~6`, `strict: true` | |
| Server state | `@tanstack/react-query` `^5` | All remote data goes through React Query. No ad-hoc `useEffect` + `fetch` for data. |
| API client | `@trpc/client` `^11` + `@trpc/tanstack-react-query` `^11` | `createTRPCClient` + `createTRPCOptionsProxy`. |
| Secure storage | `expo-secure-store` `~56` | Session token / credentials at rest. |
| Cookies | `@react-native-cookies/cookies` `^6` | Session-cookie persistence (see §4). |

**Version-alignment rule:** the tRPC and React Query **majors must match the backend's** (tRPC v11, React Query v5, TypeScript 5.7+ on the server). If they diverge, `AppRouter` types silently break. Do not bump these majors independently of `../cascade`. Same principle the backend applies to Zod.

Before adding **any** new dependency: prefer an Expo-managed package (`npx expo install <pkg>`, never raw `npm install` for native modules) and confirm it supports the New Architecture and SDK 56. Flag the addition rather than assuming.

---

## 3. Conventions

- **File layout**
  - `src/app/` — routes only (Expo Router file-based). Each file is a screen/layout.
  - `src/components/` — reusable presentational components.
  - `src/hooks/` — reusable hooks.
  - `src/constants/` — theme and static config.
  - `src/lib/` — **(to be created)** API client, query client, auth, cookie handling. Mirror `../cascade/web/src/lib/`.
- **Imports:** use the `@/*` alias (→ `src/*`). Relative `../../` chains are discouraged. The cross-repo backend type import (`../../cascade/src/api/router`) is the one deliberate exception.
- **Naming:** files are kebab-case (matches existing `themed-text.tsx`, `use-color-scheme.ts`). Components are PascalCase, hooks `useX`.
- **Platform splits:** use the existing `.web.tsx` / `.ios` / `.android` suffix convention already present in `src/components/`.
- **Styling/UI:** match what's already in the repo. Don't introduce a new styling system or component library without asking.
- **TypeScript:** no `any`. Lean on inferred tRPC types end-to-end. If you reach for `any`, stop and reconsider.
- **Lint:** `npm run lint` (`expo lint`) must pass.

---

## 4. The Cascade integration — get this right

### tRPC client
Mirror `../cascade/web/src/lib/trpc.ts`:
- `createTRPCClient<AppRouter>` with a single `httpBatchLink` pointed at `${API_URL}/trpc`.
- Wrap with `createTRPCOptionsProxy` for React Query integration.
- Import `AppRouter` as a **type** from `../cascade/src/api/router` so there's zero runtime coupling — only the type crosses the repo boundary.
- Send `x-org-context` from a header getter (see web's `setOrgContextGetter`).

### Auth flow
- Login is a **plain `fetch`**, not a tRPC call: `POST ${API_URL}/api/auth/login` with `{ email, password }`. On 200 the server returns `{ id, email, name, role }` and sets the session cookie. Non-200 returns `{ error }`.
- Logout: `POST ${API_URL}/api/auth/logout`.
- Current user: tRPC `auth.me` (protected query) → user + `effectiveOrgId` + (superadmin) `availableOrgs`.
- There is **no Bearer-token path**. The server reads the user **only from the session cookie**. Do not invent an `Authorization` header scheme on the client — it won't work against this backend.

### ⚠️ Cookie persistence (the core impedance mismatch)
React Native `fetch` does not maintain a cookie jar across requests. The backend authenticates **purely** by the `cascade_session` cookie. Therefore:
1. After login, the `Set-Cookie` must be captured and persisted (via `@react-native-cookies/cookies`, optionally mirrored into `expo-secure-store`).
2. Every subsequent request (tRPC and `auth.me`) must re-send that cookie.
3. **Do not hard-code the cookie name** — in dev it's `cascade_session_<NODE_ENV>` (e.g. `cascade_session_development`); in prod `cascade_session`. Let the cookie jar carry whatever the server set.
4. `@react-native-cookies/cookies` behaves differently on iOS/Android/web — verify against its docs and test the round-trip on a real platform, not just assumptions.

If the cookie approach proves brittle, the documented fallback is a small backend change to also accept the session token via header — **flag it, don't implement it client-side unilaterally.**

### Org context
`x-org-context` scopes requests to an org. Members are pinned to their own org; superadmins may switch (persisted locally, like web's `org-context.tsx`). Default to the user's `orgId` from `auth.me`.

### Environment / API base URL
- `localhost:3001` works on the iOS simulator; Android emulator needs `10.0.2.2`; physical devices need the host LAN IP. Make the base URL configurable (Expo public env var / `expo-constants`), not hard-coded.
- The Dashboard API must be running locally for the app to do anything (see `../cascade/README.md`).

---

## 5. Workflow expectations

- **Verify before claiming done.** Run `npm run lint`; type-check. If you couldn't run something, say so plainly.
- **Small, reviewable changes.** This is an early-stage scaffold — prefer focused commits over sweeping rewrites.
- **Match the existing code.** Read neighbouring files first; mirror their idiom, structure, and naming.
- **When the API shape is unclear, read `../cascade` — do not guess** the procedure name, input, or output. The router files are the contract.
- **Don't reach beyond the Dashboard API.** No direct calls to the Router (:3000), Worker, Redis, Postgres, or provider APIs — those are server-side concerns.
- **Ask before:** adding dependencies, changing pinned majors, introducing a new styling/state system, or proposing backend changes.

---

## 6. Roadmap (current)

Foundational integration work, in order:

1. ✅ **`src/lib/` foundation** — `api.ts` (base URL config), `query-client.ts`, `trpc.ts` (typed client against `AppRouter`), and a cookie/secure-store layer for session persistence.
2. ✅ **Auth flow** — login screen (`fetch` → cookie capture), session bootstrap on launch, `auth.me`, logout, and routing between authed/unauthed states. Lives in `src/lib/auth/` + `src/app/login.tsx` + the root-layout auth gate.
3. ✅ **Org context** — `OrgProvider`/`useOrg` (`src/lib/org-context.tsx`) registers `setOrgContextGetter` from a synchronous module ref, derives the effective org from `auth.me` (member → own org; superadmin → persisted choice clamped to `availableOrgs`, else default), persists the superadmin's choice via `expo-secure-store` (`src/lib/org-storage.ts` + `.web.ts` → `localStorage`), and invalidates React Query on switch. A minimal superadmin-only switcher lives in `src/components/org-switcher.tsx` (members render nothing); the provider is mounted in the root layout.
4. ✅ **First feature screen** — projects list → project detail / runs, proving the end-to-end typed path. A top-level `src/app/projects/` route group (`_layout.tsx` auth guard + nested `Stack`, `index.tsx` list, `[projectId].tsx` runs detail), entered from a "View projects" link on the Home tab. Data flows through thin org-scoped hooks (`src/hooks/use-projects.ts`, `src/hooks/use-project-runs.ts`) that wrap `trpc.projects.list` / `trpc.runs.list` and gate on `useOrg().isReady`. Shared presentational pieces live in `src/components/run-status-badge.tsx` (status→color pill, graceful unknown-status fallback) and `src/components/query-states.tsx` (`Loading`/`EmptyState`/`ErrorState`), with pull-to-refresh on both `FlatList`s.

Keep this list current as work lands.
