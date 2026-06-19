# Push Notifications — Backend Contract Proposal

> **Status:** Draft — pending review by cascade maintainers.
> **Related card:** https://trello.com/c/ckhDKR9w/33-push-notifications-for-run-outcomes

This document proposes the minimal backend changes required in `../cascade` to
complete the push-notification round-trip. The **client spike** (Phase A) is
already implemented with fail-soft stubs; this proposal is the handoff artifact
for Phase B.

---

## 1. Device-token registration

### Option A: REST endpoints (current client stub)

The client currently targets plain `fetch` endpoints mirroring `auth-service.ts`:

```
POST /api/notifications/register-token
POST /api/notifications/unregister-token
```

**Request body:**
```json
{
  "token": "ExponentPushToken[abc123...]",
  "platform": "ios" | "android"
}
```

Both endpoints are **authenticated** — the session cookie identifies the user.
The backend stores `(userId, token, platform)` and replaces any existing row for
the same `(userId, token)` pair on register, or deletes it on unregister.

### Option B: tRPC mutation (preferred if consistent with codebase)

If the maintainers prefer keeping all mutations in tRPC:

```ts
// src/api/routers/notifications.ts
notifications.registerDevice   // input: { token, platform }
notifications.unregisterDevice // input: { token }
```

The client can be trivially updated from `fetch` → tRPC call; the provider
wiring and fail-soft logic remain identical.

---

## 2. Push emission on run state transitions

When a run transitions to a terminal state, the backend should emit an Expo Push
notification to every device token registered for the run's owning user (or org
members with the relevant event enabled):

| Run status    | Notification event | Default |
|---------------|--------------------|---------|
| `completed`   | `completed`        | off     |
| `failed`      | `failed`           | off     |
| PR opened     | `needsReview`      | off     |

### Payload shape

```json
{
  "to": "ExponentPushToken[abc123...]",
  "title": "Run completed",
  "body": "Planning agent finished on project-name",
  "data": {
    "runId": "run_abc123"
  }
}
```

The `data.runId` field is **required** — the client uses it for deep-linking to
`/runs/[runId]` on notification tap.

### Expo Push API

Send via `https://exp.host/--/api/v2/push/send` (or the Expo Push SDK). Handle
`DeviceNotRegistered` ticket errors by cleaning up stale tokens.

---

## 3. Token cleanup

- On `DeviceNotRegistered` receipt errors, delete the token from the database.
- On user deletion / deactivation, delete all associated tokens.
- The client calls `unregister-token` on sign-out, but the backend should
  tolerate orphaned tokens gracefully (TTL or periodic sweep).

---

## 4. Storage

A simple table is sufficient:

```sql
CREATE TABLE device_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, token)
);
```

---

## 5. Per-user event preferences (future)

The client already persists per-event toggles (completed / failed / needsReview)
locally. A future enhancement could sync these to the backend so the server only
emits pushes the user wants, reducing noise and push volume. For now the backend
can emit all terminal-state pushes and let the client-side prefs control the UX.

---

## Next steps

1. Cascade maintainers review this proposal and choose Option A vs B.
2. Implement the chosen endpoints + push emission in `../cascade`.
3. Flip the client from fail-soft stubs to verified calls (update endpoint path
   or switch to tRPC mutation).
4. End-to-end test on a real device with an EAS dev build.
