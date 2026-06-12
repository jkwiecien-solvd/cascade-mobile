# Cascade Mobile

A React Native (Expo) mobile client for **[Cascade](../cascade)** — the open-source platform that orchestrates AI agents (Claude Code, Codex, opencode, LLMist) across software-development workflows in GitHub, Trello, Jira, and Linear.

This app is a thin client of Cascade's **Dashboard API** — the same tRPC API the existing `web/` dashboard consumes. It reuses the backend's `AppRouter` type for end-to-end type safety, so screens are built against the real server contract with no hand-written DTOs.

> **Status:** scaffolded. The Expo project, navigation, and the Cascade integration dependencies are installed. The tRPC client, auth flow, and feature screens are not yet wired up — see [Next steps](#next-steps).

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

**Prerequisites:** Node.js, a running Cascade Dashboard API (see the [backend dev guide](../cascade/README.md#-development)), and Xcode/Android Studio or Expo Go.

```bash
npm install
npm start          # Expo dev server — then press i / a, or scan with Expo Go
# or target a platform directly:
npm run ios
npm run android
npm run web
```

`npm run lint` runs `expo lint`.

The API base URL must point at your Cascade Dashboard API. On a simulator that's typically `http://localhost:3001`; on a physical device use your machine's LAN IP. (Wiring this through config is part of [Next steps](#next-steps).)

---

## Project structure

```
src/
  app/            # Expo Router routes (file-based). Entry: expo-router/entry
    _layout.tsx   # Root layout / providers
    index.tsx
  components/     # Reusable UI
  constants/      # theme, etc.
  hooks/          # color scheme, theme
ai/
  RULES.md        # System prompt / working rules for AI agents on this repo
```

---

## Working with AI agents

This repo is built with AI agents. Before any code is written, read:

- **[AGENTS.md](./AGENTS.md)** — Expo SDK 56 changed a lot; consult the **exact versioned docs** at <https://docs.expo.dev/versions/v56.0.0/>.
- **[ai/RULES.md](./ai/RULES.md)** — the system prompt and conventions for agents working in this codebase.

---

## Next steps

The immediate roadmap is the tRPC client, the login/cookie flow, and the first project/runs screen. See the end of [ai/RULES.md](./ai/RULES.md) for detail.

## License

MIT (see [LICENSE](./LICENSE)).
