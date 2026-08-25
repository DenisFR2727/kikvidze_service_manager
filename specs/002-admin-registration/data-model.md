# Data Model: Admin Registration & Ownership

**Feature**: `002-admin-registration`  
**Storage**: MongoDB  
**Date**: 2026-08-25  
**Extends**: [001 data-model](../001-client-job-booking/data-model.md)

## Entity Relationship

```text
Admin (1) ── authenticates ──► Session (ephemeral: adminId, login)
Admin (1) ──◄── owns ── Client (N)
Admin (1) ──◄── owns ── Job (N)
Client (1) ──◄── has many ── Job (N)   [same adminId on both]
```

## Entities

### Admin

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | yes | |
| `login` | string | yes | Unique (case-sensitive as stored after trim) |
| `passwordHash` | string | yes | bcrypt; never returned by API |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Rules**:
- Багато адмінів дозволено (знято обмеження «рівно один» з 001).
- Створення лише через реєстрацію (не через обов’язковий env seed).
- Логін унікальний; конфлікт → `CONFLICT`.
- Пароль при реєстрації: мінімум 8 символів.

### Client *(changed)*

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | yes | |
| `adminId` | ObjectId | yes | Ref → Admin; **owner** |
| `phone` | string | yes | Display form |
| `phoneNormalized` | string | yes | Digits-only / normalize helper |
| `name` | string | no | Optional |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Rules**:
- Унікальність: compound unique index `(adminId, phoneNormalized)` — не глобальний unique на phone.
- Find-or-create завжди в межах `adminId` поточної сесії.
- Видалення Job не видаляє Client.
- Чужий `adminId` недоступний через API.

### Job *(changed)*

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | yes | |
| `adminId` | ObjectId | yes | Ref → Admin; must match related Client.adminId |
| `clientId` | ObjectId | yes | Ref → Client (same owner) |
| `car` | string | yes | |
| `category` | string | yes | |
| `scheduledAt` | Date | yes | |
| `completedAt` | Date | no | |
| `workPrice` | number | yes | ≥ 0 |
| `materialPrice` | number | yes | ≥ 0 |
| `status` | enum | yes | `queued` \| `in_progress` \| `done` \| `cancelled` |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Rules**:
- При створенні: `adminId` = session admin; client find-or-create з тим самим `adminId`.
- Read/update/delete: filter `{ _id, adminId }`; miss → 404.
- Status / `completedAt` логіка без змін від 001.
- Indexes: `adminId`, `(adminId, status)`, `(adminId, scheduledAt)`, `clientId`, `category`, `completedAt`.

### Session (ephemeral)

Не документ MongoDB. Cookie `sid` містить `adminId`, `login`.

## Migration

1. Додати `adminId` до схем Client/Job (required для нових документів).
2. One-time: знайти документи без `adminId` (або `null`); якщо є ≥1 Admin — set `adminId` = oldest Admin `_id`.
3. Дропнути старий unique index на `phoneNormalized`; створити compound unique `(adminId, phoneNormalized)`.
4. Після міграції всі API paths вимагають ownership match.

## Validation Summary (auth + ownership)

| Rule | Applies |
|------|---------|
| login required, trimmed, unique | Admin register |
| password min length 8 | Admin register |
| password never stored plaintext / never in responses | Admin |
| adminId required on Client & Job | create |
| phone unique per adminId | Client |
| all mutations scoped to session adminId | Client / Job / categories |

## Out of scope (unchanged / deferred)

- Password reset, change login, delete admin account
- Roles other than admin
- Cross-admin sharing of clients/jobs
