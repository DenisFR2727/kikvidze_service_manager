# Quickstart: Admin Registration & Ownership

**Feature**: `002-admin-registration`  
**Purpose**: Validate registration, real login, and per-admin data isolation end-to-end.

## Prerequisites

- Node.js 22+
- MongoDB running locally (or Atlas URI)
- Dependencies installed (repo root + `backend/`)

## Environment

**`backend/.env`** (after this feature, `ADMIN_*` no longer required for login):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/kikvidze_service_manager
SESSION_SECRET=dev-secret-min-32-chars!!!!!!!!!!!!
CORS_ORIGIN=http://localhost:3000
```

**Root `.env.local`**:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Contract: [contracts/api.md](./contracts/api.md)  
Data model: [data-model.md](./data-model.md)

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

## Validation scenarios

### 1. Register admin A

1. Open http://localhost:3000 logged out → login screen.
2. Go to register (link «Зареєструватися»).
3. Submit login `admin-a`, password `password1`, confirm match.
4. Land in app home (auto-login) **or** can immediately log in with those credentials.

**Expect**: FR-001, FR-003, SC-001.

### 2. Reject bad registration

1. Register again with same login → conflict message, no duplicate.
2. Password shorter than 8 or confirm mismatch → validation message, no account.

**Expect**: FR-002, FR-003, FR-013.

### 3. Real login; fake credentials fail

1. Logout.
2. Login as `admin-a` / `password1` → home.
3. Try former env/seed style credentials (e.g. old `admin` / `change-me` if not registered) → rejected.
4. Refresh while logged in → stay in app; logout → gate to login.

**Expect**: FR-004–007, SC-002, SC-006.

### 4. Ownership isolation (two admins)

1. As `admin-a`, create a job (phone `+380671110001`, any car/category/prices).
2. Logout; register `admin-b` / `password1`.
3. As `admin-b`: home list/calendar/search show **no** A’s job; categories do not leak A-only categories if A had unique ones.
4. Create B’s own job with **same phone** `+380671110001` → succeeds (separate client for B).
5. Copy A’s job URL/id while logged in as B → not found / no data leak.
6. Login as A again → only A’s jobs/clients visible.

**Expect**: FR-008–011, SC-003, SC-004.

### 5. Nav login ↔ register

1. From login open register; from register open login.

**Expect**: FR-012.

## Optional API smoke (curl)

```bash
# Register
curl -c cookies.txt -H "Content-Type: application/json" \
  -d "{\"login\":\"admin-a\",\"password\":\"password1\"}" \
  http://localhost:4000/api/auth/register

# Me
curl -b cookies.txt http://localhost:4000/api/auth/me

# Jobs (should be empty for new admin)
curl -b cookies.txt http://localhost:4000/api/jobs
```

## Done when

- [ ] Two admins can register and log in with distinct credentials
- [ ] Old seed-only login path is gone
- [ ] Each admin sees only own clients/jobs
- [ ] Same phone allowed for different admins without merging data
