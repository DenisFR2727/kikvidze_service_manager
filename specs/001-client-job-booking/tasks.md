# Tasks: Client Job Booking

**Input**: Design documents from `/specs/001-client-job-booking/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in the feature specification — no TDD task blocks. Manual validation via `quickstart.md` in Polish phase.

**Organization**: Tasks grouped by user story (US0–US6) for incremental delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: `[US0]`…`[US6]` map to spec user stories
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/` (Next.js App Router)
- Backend: `backend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize backend package and wire env/scripts for local dual-process dev

- [x] T001 Create backend package layout (`backend/src/{config,models,routes,middleware,utils,services}`) and replace stub `backend/package.json` with Express/TS scripts (`dev`, `build`, `start`)
- [x] T002 [P] Add backend dependencies in `backend/package.json`: express, mongoose, bcryptjs, cookie-session (or express-session), zod, cors, dotenv; plus TS/dev: typescript, tsx, @types/*
- [x] T003 [P] Add `backend/tsconfig.json` and `backend/.env.example` (`PORT`, `MONGODB_URI`, `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `CORS_ORIGIN`)
- [x] T004 [P] Add root `.env.local.example` with `NEXT_PUBLIC_API_URL=http://localhost:4000` and document dual-start in root `README.md`
- [x] T005 Implement `backend/src/config/env.ts` (zod-validated env) and real Mongo connect in `backend/src/config/db.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared API shell, models, auth gate, frontend API client — MUST complete before story UI/API features

**⚠️ CRITICAL**: No user story work until this phase is complete

- [x] T006 Implement phone normalize helper in `backend/src/utils/phone.ts`
- [x] T007 [P] Create Mongoose `Admin` model in `backend/src/models/Admin.ts`
- [x] T008 [P] Create Mongoose `Client` model with unique `phoneNormalized` in `backend/src/models/Client.ts`
- [x] T009 [P] Create Mongoose `Job` model (status enum, prices ≥ 0 validators) in `backend/src/models/Job.ts`
- [x] T010 Implement shared error helper + Zod validate middleware in `backend/src/middleware/validate.ts` and `backend/src/middleware/errorHandler.ts`
- [x] T011 Implement `requireAuth` session middleware in `backend/src/middleware/auth.ts`
- [x] T012 Implement Express app bootstrap in `backend/src/index.ts` (cors+credentials, cookie session, JSON, mount `/api/*`, connect DB, seed single admin from env if missing)
- [x] T013 [P] Add typed API client with `credentials: 'include'` in `src/lib/api-client.ts`
- [x] T014 [P] Add shared frontend types for Job/Client/Status in `src/lib/types.ts`
- [x] T015 Create Next.js route groups: move home into `src/app/(app)/page.tsx`, add `src/app/(auth)/login/page.tsx`, add auth layout shells `src/app/(app)/layout.tsx` and `src/app/(auth)/layout.tsx`
- [x] T016 Add SCSS partials tokens/layout in `src/styles/_variables.scss` and import from `src/app/globals.scss`

**Checkpoint**: `backend` boots on :4000, Mongo connects, models compile; Next app has auth/app shells and API client ready

---

## Phase 3: User Story 0 — Увійти як адмін (Priority: P1)

**Goal**: Login screen; session cookie; unauthenticated users cannot see jobs

**Independent Test**: Wrong credentials stay on login; correct login reaches app shell; logout returns to login; refresh keeps session

### Implementation for User Story 0

- [x] T017 [US0] Implement `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` in `backend/src/routes/auth.ts` and mount in `backend/src/index.ts`
- [x] T018 [P] [US0] Build `LoginForm` UI in `src/components/auth/LoginForm.tsx` + `LoginForm.module.scss`
- [x] T019 [US0] Wire login page to API in `src/app/(auth)/login/page.tsx`
- [x] T020 [US0] Add client auth helpers (`getMe`, redirect rules) in `src/lib/auth.ts` and protect `(app)` layout in `src/app/(app)/layout.tsx` (redirect to `/login` if 401)
- [x] T021 [US0] Add logout control in `src/components/auth/LogoutButton.tsx` and place in `src/app/(app)/layout.tsx`

**Checkpoint**: Auth gate works end-to-end (FR-018–022, SC-008–009)

---

## Phase 4: User Story 1 — Записати клієнта на роботу (Priority: P1) 🎯 MVP

**Goal**: Create job with client find-or-create by phone; default status `queued`

**Independent Test**: Submit valid form → job in DB/list as «В черзі»; same phone reuses client; invalid fields blocked

### Implementation for User Story 1

- [x] T022 [US1] Implement Client find-or-create service in `backend/src/services/clientService.ts`
- [ ] T023 [US1] Implement `POST /api/jobs` (upsert client + create job `queued`) in `backend/src/routes/jobs.ts` with Zod schema in `backend/src/schemas/jobSchemas.ts`
- [ ] T024 [P] [US1] Build create `JobForm` in `src/components/jobs/JobForm.tsx` + `JobForm.module.scss` (phone, optional name, car, category, datetime, prices)
- [ ] T025 [US1] Embed create panel on home in `src/app/(app)/page.tsx` and call `POST /api/jobs` via `src/lib/api-client.ts`
- [ ] T026 [US1] Show success/error toasts or inline messages after create in `src/components/jobs/JobForm.tsx`

**Checkpoint**: Admin can create persistent jobs linked to clients (FR-001, FR-003, FR-023–025) — **MVP demo ready** with auth + create (+ minimal list fetch optional below)

---

## Phase 5: User Story 2 — Список + календар на головній (Priority: P1)

**Goal**: Default list of jobs; switcher to week calendar; click opens detail route stub ok if US6 not done yet (link to `/jobs/[id]`)

**Independent Test**: Home defaults to list; switch to week calendar shows same jobs by relevant date; empty state when none

### Implementation for User Story 2

- [ ] T027 [US2] Implement `GET /api/jobs` returning items with nested `client` + `displayAt` in `backend/src/routes/jobs.ts`
- [ ] T028 [P] [US2] Build `JobList` in `src/components/jobs/JobList.tsx` + `JobList.module.scss`
- [ ] T029 [P] [US2] Build week `JobCalendar` in `src/components/jobs/JobCalendar.tsx` + `JobCalendar.module.scss` (prev/next week)
- [ ] T030 [US2] Add list/calendar view switcher state on `src/app/(app)/page.tsx` (default list per FR-029/030)
- [ ] T031 [US2] Fetch jobs on home load and pass into list/calendar; link each item to `/jobs/[id]` in `src/app/(app)/page.tsx`

**Checkpoint**: List + calendar switch works (FR-007–008, FR-029–031, SC-004/012 partial without filters)

---

## Phase 6: User Story 3 — Змінювати статус роботи (Priority: P2)

**Goal**: Change job status among four values; set `completedAt` when entering `done`

**Independent Test**: Change queued → in_progress → done sets completedAt; cancel keeps record; any status↔status allowed

### Implementation for User Story 3

- [ ] T032 [US3] Add status transition helper (set `completedAt` on `done`) in `backend/src/services/jobService.ts`
- [ ] T033 [US3] Implement `PATCH /api/jobs/:id` status (and shared patch entry) in `backend/src/routes/jobs.ts`
- [ ] T034 [P] [US3] Add `JobStatusSelect` control in `src/components/jobs/JobStatusSelect.tsx`
- [ ] T035 [US3] Enable quick status change from list rows in `src/components/jobs/JobList.tsx` (calls PATCH)

**Checkpoint**: Status lifecycle works from list (FR-004–006, SC-006)

---

## Phase 7: User Story 4 — Фільтрація (Priority: P2)

**Goal**: Filter jobs by status and date range; filters apply to both list and calendar

**Independent Test**: Filter in_progress only shows those; date range narrows; reset restores full set; calendar matches list

### Implementation for User Story 4

- [ ] T036 [US4] Extend `GET /api/jobs` query (`status`, `from`, `to`, `category`) in `backend/src/routes/jobs.ts`
- [ ] T037 [P] [US4] Build `JobFilters` panel in `src/components/jobs/JobFilters.tsx` + `JobFilters.module.scss`
- [ ] T038 [US4] Wire filters into home state and refetch in `src/app/(app)/page.tsx` (shared filter for list+calendar — FR-032)
- [ ] T039 [US4] Implement `GET /api/categories` in `backend/src/routes/categories.ts` and category suggestions in `src/components/jobs/JobForm.tsx` / filter category select

**Checkpoint**: Filters + categories work (FR-010, FR-015, FR-032)

---

## Phase 8: User Story 5 — Пошук за телефоном / авто (Priority: P2)

**Goal**: Search jobs/clients by phone or car substring

**Independent Test**: Partial phone/car returns matches; no matches → empty state

### Implementation for User Story 5

- [ ] T040 [US5] Extend `GET /api/jobs?q=` and implement `GET /api/clients?q=` in `backend/src/routes/jobs.ts` and `backend/src/routes/clients.ts`
- [ ] T041 [P] [US5] Build search input UI in `src/components/jobs/JobSearch.tsx` + `JobSearch.module.scss`
- [ ] T042 [US5] Integrate search with home refetch in `src/app/(app)/page.tsx`

**Checkpoint**: Search works (FR-011–012, SC-003)

---

## Phase 9: User Story 6 — Картка роботи: перегляд / редагування / видалення (Priority: P2)

**Goal**: Full job card; edit all fields; delete with confirm; phone change rebinds client

**Independent Test**: Open card from list/calendar; edit+save; delete confirm removes job; cancel confirm keeps job; client remains after last job deleted

### Implementation for User Story 6

- [ ] T043 [US6] Implement `GET /api/jobs/:id` and harden `PATCH`/`DELETE /api/jobs/:id` (phone rebind) in `backend/src/routes/jobs.ts` + `backend/src/services/jobService.ts`
- [ ] T044 [P] [US6] Build job detail/edit UI in `src/components/jobs/JobDetailCard.tsx` + `JobDetailCard.module.scss`
- [ ] T045 [US6] Implement page `src/app/(app)/jobs/[id]/page.tsx` loading job by id
- [ ] T046 [US6] Add delete confirmation dialog flow in `src/components/jobs/JobDetailCard.tsx` calling `DELETE /api/jobs/:id`
- [ ] T047 [US6] Ensure list/calendar refresh or router refresh after edit/delete navigation back to `src/app/(app)/page.tsx`

**Checkpoint**: Full card CRUD complete (FR-014, FR-026–028, SC-010–011)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: UX consistency, responsive layout, docs, quickstart validation

- [ ] T048 [P] Responsive polish for home panels (form/filters/list/calendar) in `src/components/jobs/*.module.scss` and `src/app/globals.scss`
- [ ] T049 [P] Ukrainian UI labels for statuses/buttons aligned with spec in `src/lib/i18n/uk.ts` (or constants file)
- [ ] T050 Align root `README.md` + `backend/README.md` with quickstart start commands
- [ ] T051 Run manual validation scenarios 1–6 from `specs/001-client-job-booking/quickstart.md` and fix blockers
- [ ] T052 [P] Remove obsolete default Next marketing leftover assets/styles if unused under `src/app/` and `public/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → no deps
- **Phase 2 Foundational** → after Setup; **blocks all stories**
- **US0 (Phase 3)** → after Foundational
- **US1 (Phase 4)** → after US0 (needs auth session for API)
- **US2 (Phase 5)** → after US1 (needs jobs to display; can stub with seed)
- **US3–US5 (Phases 6–8)** → after US2 (enhance list/home); can be parallelized across people after US2
- **US6 (Phase 9)** → after US2 (detail links); ideally after US3 PATCH exists (T033)
- **Polish** → after desired stories complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US0 Login | Foundation | Gate for everything |
| US1 Create | US0 | MVP core |
| US2 List/Calendar | US1 | Needs data; GET can work with empty |
| US3 Status | US2 + PATCH base | List quick-change |
| US4 Filters | US2 | Same GET query |
| US5 Search | US2 | `q` param |
| US6 Detail | US2 + US3 PATCH/DELETE | Card is source of truth for edit/delete |

### Parallel Opportunities

- T002–T004 (setup config files)
- T007–T009 (models)
- T013–T014 (frontend lib)
- T018 vs T017 (UI form vs auth routes after contract agreed)
- T028–T029 (list vs calendar components)
- After US2: US3/US4/US5 can proceed in parallel if API query/patch ownership coordinated
- T048–T049, T052 in polish

---

## Parallel Example: User Story 2

```text
# After T027 (GET /api/jobs) is done:
T028 Build JobList in src/components/jobs/JobList.tsx
T029 Build JobCalendar in src/components/jobs/JobCalendar.tsx
# Then:
T030–T031 Wire switcher + fetch on src/app/(app)/page.tsx
```

---

## Parallel Example: After User Story 2

```text
Developer A: US3 status (T032–T035)
Developer B: US4 filters (T036–T039)
Developer C: US5 search (T040–T042)
# Then merge before US6 detail card
```

---

## Implementation Strategy

### MVP First (Auth + Create + minimal list)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US0 Login  
4. Phase 4 US1 Create job  
5. Phase 5 US2 List (calendar can slip slightly)  
6. **STOP & VALIDATE** quickstart scenarios 1–2 (+ partial 3)

### Incremental Delivery

1. US0 → secured app  
2. US1 → can book clients (**first business value**)  
3. US2 → daily board + calendar  
4. US3 → workflow statuses  
5. US4–US5 → find/filter at scale  
6. US6 → full card edit/delete  
7. Polish → quickstart 1–6 green  

### Suggested MVP Scope

**US0 + US1 + US2 (list at minimum)** — admin can log in, create jobs, see them. Calendar switcher included if time; otherwise list-only interim still meets core booking value.

---

## Notes

- Checklist format: `- [ ] Txxx ...` with paths — required for `/speckit-implement`
- No automated test tasks (not requested); add Vitest/Playwright later if desired
- Commit after each story checkpoint
- Avoid writing Mongo access from Next.js — all via `backend/`
