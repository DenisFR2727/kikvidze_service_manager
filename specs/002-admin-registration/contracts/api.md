# API Contract: Admin Registration & Ownership

**Base URL**: `http://localhost:4000` (dev)  
**Format**: JSON  
**Auth**: Session cookie `sid` (httpOnly). All data endpoints require authenticated admin. Ownership is always the session `adminId`.

**Error shape** (unchanged):

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | CONFLICT | INTERNAL",
    "message": "Human-readable message",
    "fields": { "login": "Already taken" }
  }
}
```

This contract **extends** [001 api.md](../../001-client-job-booking/contracts/api.md). Unlisted endpoints keep prior shapes but become **admin-scoped**.

---

## Auth

### `POST /api/auth/register` *(new)*

Unauthenticated.

**Body**:
```json
{
  "login": "denys",
  "password": "secret123"
}
```

**Rules**:
- `login`: trimmed, non-empty
- `password`: min 8 characters
- Unique `login` → else `409 CONFLICT`
- On success: create Admin (bcrypt hash), set session cookie, return like login

**Responses**:
- `201` `{ "ok": true, "admin": { "login": "denys" } }` + Set-Cookie `sid`
- `400` validation (short password, empty login, …)
- `409` login already taken

> UI may collect `passwordConfirm` locally; it is **not** required in the API body.

### `POST /api/auth/login`

Unauthenticated. Behavior unchanged except credentials must match a **registered** Admin document (no env-seed bypass).

**Body**:
```json
{ "login": "denys", "password": "secret123" }
```

**Responses**:
- `200` `{ "ok": true, "admin": { "login": "denys" } }` + Set-Cookie
- `401` invalid credentials

### `POST /api/auth/logout`

Unchanged: `200` `{ "ok": true }` + clear cookie.

### `GET /api/auth/me`

Unchanged:
- `200` `{ "admin": { "login": "denys" } }`
- `401` unauthorized

---

## Clients *(scoped)*

All client routes require auth. Results and mutations limited to `adminId = session.adminId`.

### `GET /api/clients?q=`

Same response shape as 001; only owner’s clients.

### `GET /api/clients/:id`

- `200` if id belongs to session admin
- `404` if missing **or** owned by another admin

---

## Jobs *(scoped)*

All job routes require auth and `adminId` scope.

### `GET /api/jobs`

Same query params as 001 (`status`, `from`, `to`, `category`, `q`, `clientId`). Implicit filter: session `adminId`.

### `GET /api/jobs/:id`

- `200` owner’s job
- `404` missing or other admin’s job

### `POST /api/jobs`

Same body as 001. Server:
1. Find-or-create Client by normalized phone **within** session `adminId`
2. Create Job with same `adminId`, `status=queued`

**Responses**: `201` | `400`

### `PATCH /api/jobs/:id`

Same partial fields as 001. Only if job `adminId` matches session; else `404`. Phone change find-or-creates client in same admin scope.

### `DELETE /api/jobs/:id`

Owner only; else `404`. Client retained.

---

## Categories *(scoped)*

### `GET /api/categories`

Distinct `Job.category` values **for session admin only**.

**Response `200`**: `{ "items": ["Пошив сидінь", ...] }` (sorted)

---

## Ownership guarantees (normative)

| Action | Rule |
|--------|------|
| List/search | Never returns other admins’ rows |
| Get/patch/delete by id | Other admin’s id → `404` (not `403`) |
| Create | Always stamps session `adminId` |
| Phone uniqueness | Per `adminId` only |

---

## Removed / retired behavior

- Runtime seed of a single admin from required `ADMIN_LOGIN` / `ADMIN_PASSWORD` as the only way to log in.
- Global unique client phone across all admins.
- Any API that returns unscoped clients/jobs/categories.
