# Data Model: Client Job Booking

**Feature**: `001-client-job-booking`  
**Storage**: MongoDB  
**Date**: 2026-08-06

## Entity Relationship

```text
Admin (1) ── authenticates ──► Session (ephemeral)
Client (1) ──◄── has many ── Job (N)
Job.category (string) ──► derived Category list (distinct, not a table)
```

## Entities

### Admin

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | yes | |
| `login` | string | yes | Unique; single row expected in v1 |
| `passwordHash` | string | yes | bcrypt |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Rules**:
- Рівно один активний адмін у v1 (seed при старті, якщо колекція порожня — з `ADMIN_LOGIN` / `ADMIN_PASSWORD` env).
- Пароль ніколи не повертається API.

### Client

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | yes | |
| `phone` | string | yes | Display form as entered/normalized pretty |
| `phoneNormalized` | string | yes | Digits-only (or E.164); **unique index** |
| `name` | string | no | Optional |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Rules**:
- Унікальність за `phoneNormalized` (FR-023/024).
- Видалення останньої Job **не** видаляє Client.
- При зміні телефону на Job: find-or-create Client за новим телефоном і переприв’язати Job.

### Job

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | yes | |
| `clientId` | ObjectId | yes | Ref → Client |
| `car` | string | yes | Make/model text |
| `category` | string | yes | Free text; trimmed |
| `scheduledAt` | Date | yes | Planned date+time (UTC stored, local display) |
| `completedAt` | Date | no | Set on transition to `done` if empty |
| `workPrice` | number | yes | ≥ 0; UAH |
| `materialPrice` | number | yes | ≥ 0; UAH |
| `status` | enum | yes | See below |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Status enum** (storage / API):

| Code | UI (uk) |
|------|---------|
| `queued` | В черзі |
| `in_progress` | В процесі |
| `done` | Робота виконана |
| `cancelled` | Відміна роботи |

**Default**: new Job → `queued`.

**Relevant display datetime**:
- `queued` | `in_progress` | `cancelled` → `scheduledAt`
- `done` → `completedAt` (fallback `scheduledAt` if missing)

**Indexes** (recommended):
- `clientId`
- `status`
- `scheduledAt`
- `completedAt`
- `category`
- text/regex-friendly: `car`; client search via Client.phoneNormalized / name

### Category (derived)

Не окрема колекція в v1. `GET /categories` повертає sorted distinct `Job.category`.

## State Transitions

Будь-який статус ↔ будь-який статус (адмін може виправляти помилки).

Спеціальна логіка:
- Enter `done`: якщо `completedAt` is null → `completedAt = now`
- Leave `done` (optional): `completedAt` зберігається, доки адмін не змінить вручну
- `cancelled` не hard-delete; hard-delete лише через DELETE Job

## Validation Summary

| Rule | Applies |
|------|---------|
| phone required, non-empty after normalize | Client / Job create |
| name optional | Client |
| car, category required non-empty | Job |
| scheduledAt required valid datetime | Job |
| workPrice, materialPrice ≥ 0 | Job |
| status ∈ enum | Job |
| clientId must exist | Job |
| delete Job requires explicit client confirm (UI) | UX; API is idempotent DELETE |

## Soft vs Hard Delete

- **Cancel** = status `cancelled` (history kept)
- **Delete** = remove Job document; Client retained
