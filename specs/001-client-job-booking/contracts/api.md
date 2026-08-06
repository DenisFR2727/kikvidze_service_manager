# API Contract: Client Job Booking

**Base URL**: `http://localhost:4000` (dev)  
**Format**: JSON  
**Auth**: Session cookie `sid` (httpOnly). All endpoints except login/logout-check require authenticated admin unless noted.

**Error shape**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | CONFLICT | INTERNAL",
    "message": "Human-readable message",
    "fields": { "phone": "Required" }
  }
}
```

---

## Auth

### `POST /api/auth/login`

Unauthenticated.

**Body**:
```json
{ "login": "admin", "password": "secret" }
```

**Responses**:
- `200` `{ "ok": true, "admin": { "login": "admin" } }` + Set-Cookie
- `401` invalid credentials

### `POST /api/auth/logout`

Authenticated (or no-op if already logged out).

**Responses**: `200` `{ "ok": true }` + clear cookie

### `GET /api/auth/me`

**Responses**:
- `200` `{ "admin": { "login": "admin" } }`
- `401` unauthorized

---

## Clients

### `GET /api/clients?q=`

Search by phone (partial) or name (partial).

**Response `200`**:
```json
{
  "items": [
    {
      "id": "...",
      "phone": "+380671112233",
      "name": "Іван",
      "jobsCount": 3
    }
  ]
}
```

### `GET /api/clients/:id`

**Response `200`**: client + optional embedded recent jobs summary  
**404** if missing

---

## Jobs

### `GET /api/jobs`

Query:
| Param | Type | Description |
|-------|------|-------------|
| `status` | enum | Filter one status |
| `from` | ISO date | Inclusive lower bound on relevant date |
| `to` | ISO date | Inclusive upper bound |
| `category` | string | Exact category |
| `q` | string | Partial match phone / client name / car |
| `clientId` | string | Jobs for one client |

**Response `200`**:
```json
{
  "items": [
    {
      "id": "...",
      "client": { "id": "...", "phone": "...", "name": null },
      "car": "BMW X5",
      "category": "Пошив сидінь",
      "scheduledAt": "2026-08-10T09:00:00.000Z",
      "completedAt": null,
      "workPrice": 5000,
      "materialPrice": 2000,
      "status": "queued",
      "displayAt": "2026-08-10T09:00:00.000Z"
    }
  ]
}
```

`displayAt` = relevant datetime per status rules (FR-008).

### `GET /api/jobs/:id`

Full job card payload (same fields as list item + timestamps).

**404** if missing

### `POST /api/jobs`

**Body**:
```json
{
  "phone": "+380671112233",
  "name": "Іван",
  "car": "BMW X5",
  "category": "Пошив сидінь",
  "scheduledAt": "2026-08-10T09:00:00.000Z",
  "workPrice": 5000,
  "materialPrice": 2000
}
```

**Behavior**: find-or-create Client by normalized phone; create Job `status=queued`.

**Responses**:
- `201` created job (full)
- `400` validation

### `PATCH /api/jobs/:id`

Partial update. May include: `phone`, `name`, `car`, `category`, `scheduledAt`, `completedAt`, `workPrice`, `materialPrice`, `status`.

**Behavior**:
- Phone change → rebind/find-or-create client
- Status → `done` sets `completedAt` if absent

**Responses**: `200` updated | `400` | `404`

### `DELETE /api/jobs/:id`

Hard delete job. Client retained.

**Responses**: `204` | `404`

---

## Categories

### `GET /api/categories`

**Response `200`**:
```json
{ "items": ["Пошив сидінь", "Ремонт руля"] }
```

Sorted unique strings from existing jobs.

---

## Authz matrix

| Endpoint | Public | Admin |
|----------|--------|-------|
| POST login | ✓ | ✓ |
| POST logout | ✓ | ✓ |
| GET me | | ✓ |
| Clients / Jobs / Categories | | ✓ |

---

## Mapping to FR (selected)

| FR | Endpoints / behavior |
|----|----------------------|
| FR-018–022 | Auth routes + cookie gate |
| FR-001, 023–025 | POST/PATCH jobs + Client upsert |
| FR-003–006 | status + completedAt rules |
| FR-007–012, 029–032 | GET jobs filters + UI consumes same data for list/calendar |
| FR-026–028 | GET/PATCH/DELETE job by id |
| FR-015 | GET categories |
| FR-017 | validation on prices |
