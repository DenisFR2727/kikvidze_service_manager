# Tasks: Admin Registration & Ownership

**Input**: Design documents from `/specs/002-admin-registration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in the feature specification — no TDD task blocks. Manual validation via `quickstart.md` in Polish phase.

**Organization**: Tasks grouped by user story (US1–US4) for incremental delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: `[US1]`…`[US4]` map to spec user stories
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/` (Next.js App Router)
- Backend: `backend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align env/docs with multi-admin registration (no required seed credentials)

- [x] T001 Update `backend/.env.example` — remove required `ADMIN_LOGIN` / `ADMIN_PASSWORD`; keep `PORT`, `MONGODB_URI`, `SESSION_SECRET`, `CORS_ORIGIN` per `specs/002-admin-registration/quickstart.md`
- [x] T002 [P] Update root `.env.local.example` and root `README.md` auth section: register first admin via UI/API; dual-start unchanged (`backend` :4000, Next :3000)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ownership schema, orphan migration, retire env-seed login path — MUST complete before user stories

**⚠️ CRITICAL**: No user story work until this phase is complete

- [x] T003 Add required `adminId` (ObjectId ref Admin) to `backend/src/models/Client.ts`; replace unique `phoneNormalized` with compound unique index `(adminId, phoneNormalized)`
- [x] T004 [P] Add required `adminId` (ObjectId ref Admin) + indexes (`adminId`, `(adminId, status)`, `(adminId, scheduledAt)`) to `backend/src/models/Job.ts`
- [x] T005 Implement one-time orphan ownership migration in `backend/src/services/migrateOwnership.ts` (assign clients/jobs missing `adminId` to oldest Admin when ≥1 admin exists; drop legacy phone unique index safely)
- [x] T006 Make `ADMIN_LOGIN` / `ADMIN_PASSWORD` optional (or remove) in `backend/src/config/env.ts`; stop calling `seedAdminIfMissing` from `backend/src/index.ts`; call `migrateOwnership` after `connectDB` instead
- [x] T007 [P] Retire or no-op `backend/src/services/seedAdmin.ts` (delete file and imports, or document unused — must not create admins on boot)

**Checkpoint**: Models compile with `adminId`; API boots without seeding an admin; empty `admins` collection means login fails until registration (US1)

---

## Phase 3: User Story 1 — Зареєструвати адміна (Priority: P1) 🎯 MVP

**Goal**: Self-registration with login + password; auto-login session; unique login; min password length 8

**Independent Test**: Register new admin → land in app (or can log in immediately); duplicate login rejected; short password rejected; old seed-only account does not exist unless registered

### Implementation for User Story 1

- [ ] T008 [US1] Add Zod register body schema and `POST /api/auth/register` handler in `backend/src/routes/auth.ts` (trim login, password min 8, bcrypt hash, `409 CONFLICT` on duplicate login, `201` + `setAdminSession` auto-login) per `specs/002-admin-registration/contracts/api.md`
- [ ] T009 [P] [US1] Add `RegisterRequest` / response types in `src/lib/types.ts` and `register()` helper in `src/lib/auth.ts`
- [ ] T010 [P] [US1] Add Ukrainian register/validation/error strings in `src/lib/i18n/uk.ts` (`uk.auth.register*` / conflict / weak password)
- [ ] T011 [US1] Build `RegisterForm` (login, password, passwordConfirm) in `src/components/auth/RegisterForm.tsx` (+ SCSS module if matching `LoginForm` pattern)
- [ ] T012 [US1] Add register page `src/app/(auth)/register/page.tsx` wired to `register()` → `router.replace(APP_HOME_PATH)` on success; map API errors to `uk` messages

**Checkpoint**: Can create a real admin and enter the app without env seed (FR-001–003, SC-001/005) — **MVP**

---

## Phase 4: User Story 2 — Увійти з реальними обліковими даними (Priority: P1)

**Goal**: Login/logout/`/me` work only against registered Admin documents; fake/env credentials never grant access

**Independent Test**: Logout → login with registered credentials succeeds; unknown/wrong password fails; former env seed values fail if not registered; refresh keeps session; logout gates app

### Implementation for User Story 2

- [ ] T013 [US2] Verify/adjust `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` in `backend/src/routes/auth.ts` so login only matches `Admin` collection (no env bypass); keep existing cookie session behavior
- [ ] T014 [US2] Confirm `AuthGate` / `(app)` protection still redirects unauthenticated users to `/login` via `src/components/auth/AuthGate.tsx` and `src/app/(app)/layout.tsx`; ensure logout in `src/components/auth/LogoutButton.tsx` clears access
- [ ] T015 [P] [US2] Polish login copy/errors in `src/app/(auth)/login/page.tsx` and `src/lib/i18n/uk.ts` so UX assumes registered accounts only (no hint of default `admin`/`change-me`)

**Checkpoint**: Real session auth only (FR-004–007, SC-002, SC-006)

---

## Phase 5: User Story 3 — Бачити й вести лише свої роботи з клієнтами (Priority: P1)

**Goal**: Every client/job stamped with session `adminId`; list/search/calendar/detail/mutations/categories never leak other admins’ data; phone unique per admin

**Independent Test**: Admin A creates jobs; admin B sees none of them; same phone OK for B as separate client; B cannot open A’s job id

### Implementation for User Story 3

- [ ] T016 [US3] Update find-or-create (and related client helpers) in `backend/src/services/clientService.ts` to require `adminId` and query/create within that scope
- [ ] T017 [US3] Update job create/update/status/delete helpers in `backend/src/services/jobService.ts` to stamp/filter by `adminId` and enforce client ownership match
- [ ] T018 [US3] Scope `GET/POST/PATCH/DELETE` job handlers in `backend/src/routes/jobs.ts` to `getAdminSession(req).adminId`; other admin’s id → `404 NOT_FOUND`
- [ ] T019 [P] [US3] Scope client search/get in `backend/src/routes/clients.ts` and `backend/src/services/clientSearch.ts` by session `adminId`
- [ ] T020 [P] [US3] Scope distinct categories in `backend/src/routes/categories.ts` to session `adminId` only
- [ ] T021 [US3] Smoke-check frontend home/detail still work with scoped API (`src/app/(app)/page.tsx`, `src/app/(app)/jobs/[id]/page.tsx`) — no UI ownership switches needed if API returns only own data; fix any assumptions that break empty lists for new admins

**Checkpoint**: Dual-admin isolation holds (FR-008–011, SC-003–004)

---

## Phase 6: User Story 4 — Перейти між входом і реєстрацією (Priority: P2)

**Goal**: Clear navigation login ↔ register

**Independent Test**: From login open register; from register open login

### Implementation for User Story 4

- [ ] T022 [P] [US4] Add «Зареєструватися» link to `/register` on `src/app/(auth)/login/page.tsx` and/or `src/components/auth/LoginForm.tsx` using `uk` strings
- [ ] T023 [P] [US4] Add «Увійти» link to `/login` on `src/app/(auth)/register/page.tsx` and/or `src/components/auth/RegisterForm.tsx` using `uk` strings

**Checkpoint**: FR-012 satisfied

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Docs alignment and end-to-end validation

- [ ] T024 [P] Align any remaining docs (`README.md`, comments in `backend/src/routes/api.ts`) with register + ownership contracts
- [ ] T025 Run manual validation scenarios from `specs/002-admin-registration/quickstart.md` (register A/B, isolation, fake credentials fail, nav links)
- [ ] T026 [P] Remove dead references to `ADMIN_LOGIN`/`ADMIN_PASSWORD`/`seedAdmin` from codebase search (env examples, comments, unused imports)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP registration
- **US2 (Phase 4)**: After US1 recommended (needs a registered admin to validate login path); can start after Foundational if an admin is inserted manually
- **US3 (Phase 5)**: After Foundational; practically after US1 so two real admins can be created for isolation test
- **US4 (Phase 6)**: After US1 (register page exists); can parallel with US2/US3 on different files
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story deps — **MVP**
- **US2 (P1)**: After Foundational; best after US1
- **US3 (P1)**: After Foundational (schema); validate with two US1 registrations
- **US4 (P2)**: After US1 page exists

### Within Each User Story

- Backend contract/handler before frontend wiring where both change
- Models/services before routes (Foundational + US3)
- Story complete before next priority when solo

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T003 ∥ T004; T007 ∥ alongside T005/T006 carefully (T006 depends on T005 existing)
- T009 ∥ T010 after T008 contract known; T022 ∥ T023
- T019 ∥ T020 after services updated
- US4 UI links ∥ US3 backend scoping (different files)

---

## Parallel Example: User Story 1

```bash
# After T008 (register API) is done, in parallel:
Task: "Add RegisterRequest types in src/lib/types.ts and register() in src/lib/auth.ts"
Task: "Add Ukrainian register strings in src/lib/i18n/uk.ts"
# Then sequentially:
Task: "Build RegisterForm in src/components/auth/RegisterForm.tsx"
Task: "Wire src/app/(auth)/register/page.tsx"
```

## Parallel Example: User Story 3

```bash
# After T016–T017 services:
Task: "Scope clients routes/search by adminId"
Task: "Scope categories by adminId"
# Jobs routes (T018) may run after services; avoid editing same service files in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema + no seed)
3. Complete Phase 3: US1 Register
4. **STOP and VALIDATE**: Register → enter app with real credentials
5. Demo MVP

### Incremental Delivery

1. Setup + Foundational → no fake admin on boot
2. US1 → registration MVP
3. US2 → harden real login/logout story
4. US3 → per-admin clients/jobs isolation (critical for spec promise)
5. US4 → nav polish
6. Polish → quickstart checklist

### Suggested MVP Scope

**US1 only** (register + auto-login) after Foundational — enough to replace fake seed entry. **Ship US3 before calling the feature done** (ownership is explicit in the user request).

---

## Notes

- [P] = different files, no incomplete dependencies
- No automated test tasks (not requested in spec)
- Frontend mostly reuses existing job UI; isolation is server-enforced
- Commit after each task or logical group
- Stop at checkpoints to validate independently
