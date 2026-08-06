# Quickstart: Client Job Booking

**Feature**: `001-client-job-booking`  
**Purpose**: Validate the feature end-to-end after implementation (not a full test suite).

## Prerequisites

- Node.js 22+
- MongoDB running locally (or Atlas URI)
- Repo dependencies installed (root + `backend/` when backend package is initialized)

## Environment

**`backend/.env`** (see `.env.example` when added in implementation):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/kikvidze_service_manager
ADMIN_LOGIN=admin
ADMIN_PASSWORD=change-me
SESSION_SECRET=dev-secret-min-32-chars!!!!!!!!!!!!
CORS_ORIGIN=http://localhost:3000
```

**Root `.env.local`**:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Start (local)

```bash
# Terminal A — API
cd backend
npm install
npm run dev

# Terminal B — UI
cd ..
npm install
npm run dev
```

- UI: http://localhost:3000  
- API: http://localhost:4000  

Contract reference: [contracts/api.md](./contracts/api.md)  
Data model: [data-model.md](./data-model.md)

## Validation scenarios

### 1. Auth gate

1. Open http://localhost:3000 while logged out → login screen only (no job data).
2. Wrong password → error message, stay on login.
3. Correct `ADMIN_LOGIN` / `ADMIN_PASSWORD` → home with **list** view by default.
4. Logout → back to login; refresh does not show jobs.

**Expect**: SC-008, SC-009, FR-018–022.

### 2. Create job + client upsert

1. Add job: phone, optional name, car, category, date/time, prices ≥ 0.
2. Save → appears in list as **В черзі**.
3. Create second job with **same phone** → same client (no duplicate client); two jobs in history/search.

**Expect**: FR-001, FR-003, FR-023–025; data persists after refresh (SC-002).

### 3. List / calendar switch + filters

1. Default = list.
2. Switch to calendar (week) → same jobs on scheduled/relevant dates.
3. Filter by status / date range → list and calendar show the same filtered set.
4. Reset filters → full set.

**Expect**: FR-007–010, FR-029–032, SC-004, SC-012.

### 4. Search

1. Search by partial phone → matching client jobs.
2. Search by car substring → matching jobs.
3. Nonsense query → empty state, no crash.

**Expect**: FR-011–012, SC-003.

### 5. Job card: edit / status / delete

1. Click a job → full card (client, car, category, prices, status, dates).
2. Change status to **В процесі**, then **Робота виконана** → `completedAt` set.
3. Edit fields and save → list/calendar reflect changes.
4. Delete with confirm → job gone; client remains for same phone on next booking.
5. Delete cancel → job unchanged.

**Expect**: FR-005–006, FR-026–028, SC-010, SC-011.

### 6. Validation

1. Submit create/edit without phone or with negative price → blocked with field errors.
2. Overlapping times for two jobs → both allowed.

**Expect**: FR-013, FR-017; edge case overlap.

## API smoke (optional, curl)

```bash
# Login (save cookie jar)
curl -c cookies.txt -H "Content-Type: application/json" \
  -d "{\"login\":\"admin\",\"password\":\"change-me\"}" \
  http://localhost:4000/api/auth/login

# Create job
curl -b cookies.txt -H "Content-Type: application/json" \
  -d "{\"phone\":\"+380671112233\",\"car\":\"BMW X5\",\"category\":\"Пошив сидінь\",\"scheduledAt\":\"2026-08-10T09:00:00.000Z\",\"workPrice\":5000,\"materialPrice\":2000}" \
  http://localhost:4000/api/jobs

# List
curl -b cookies.txt "http://localhost:4000/api/jobs"
```

## Done when

Усі сценарії 1–6 проходять вручну на local stack без помилок у консолі API/UI для happy path.
