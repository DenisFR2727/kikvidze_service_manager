# Implementation Plan: Admin Registration & Ownership

**Branch**: `002-admin-registration` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-admin-registration/spec.md`

## Summary

Заміна seed/фейкового єдиного адміна на самореєстрацію з логіном і паролем, збереження cookie-сесії, та обов’язкова прив’язка клієнтів і робіт до адміна-власника з ізоляцією даних між обліковими записами.

**Технічний підхід**: розширити існуючий Express + Mongoose + cookie-session стек — `POST /api/auth/register`, прибрати обов’язковий env-seed як єдиний спосіб входу; додати `adminId` на `Client`/`Job`, compound unique `(adminId, phoneNormalized)`, фільтрацію всіх client/job/category запитів за `session.adminId`; на фронті — екран `/register` і навігація login ↔ register.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend), Node.js 22.x

**Primary Dependencies**: Next.js 16.3, React 19, Sass; Express + Mongoose + bcrypt + cookie-session; Zod

**Storage**: MongoDB (`admins`, `clients`, `jobs`) — schema evolution: ownership fields + index changes

**Testing**: Backend Vitest + Supertest (register/login + ownership isolation); Frontend smoke: register → login → create job as A, verify B cannot see; `npm run lint` / `tsc`

**Target Platform**: Web (desktop-first, mobile-responsive)

**Project Type**: Web application (Next.js frontend + Express API backend)

**Performance Goals**: Реєстрація + перший вхід < 2 хв (SC-001); list/search залишаються в межах існуючих цілей (~5k jobs scoped per admin)

**Constraints**: Без ролей/invite/password-reset у цій фічі; пароль min 8; пароль ніколи в клієнтському бандлі; чужі `adminId` не розкриваються через API (404/порожній список)

**Scale/Scope**: Кілька адмінів однієї інсталяції; кожен веде власних клієнтів/роботи; екрани: login, register, існуючі app screens без зміни бізнес-UX (лише scoped data)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` — незаповнений шаблон. Гейти = project defaults (як у `001`):

| Gate | Status | Notes |
|------|--------|-------|
| Align with declared stack (Next/TS/SCSS + Express/Mongo) | PASS | Без нового стеку |
| Prefer simple over premature abstraction | PASS | Один API, без multi-tenant SaaS platform |
| Spec-driven: FR covered by data model + contracts | PASS | Phase 1 maps FR-001–013 |
| No unjustified microservices / extra apps | PASS | Лише `src/` + `backend/` |
| Security: credentials not in client bundle; auth on all data routes | PASS | bcrypt + session; ownership enforced server-side |

**Post-Phase 1 re-check**: PASS — design додає register endpoint, ownership fields/indexes і UI register; без нових deployable units.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-registration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md                 # (/speckit-tasks — later)
```

### Source Code (repository root)

```text
src/                              # Next.js App Router frontend
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # + link to register
│   │   └── register/page.tsx     # NEW registration screen
│   └── (app)/                    # unchanged UX; data already session-scoped via API
├── components/auth/
│   ├── LoginForm.tsx             # + nav to register
│   ├── RegisterForm.tsx          # NEW
│   ├── AuthGate.tsx
│   └── LogoutButton.tsx
├── lib/
│   ├── auth.ts                   # + register()
│   ├── types.ts                  # RegisterRequest / responses
│   └── i18n/uk.ts                # register strings / errors
└── styles/

backend/
├── src/
│   ├── models/
│   │   ├── Admin.ts              # multi-admin (already unique login)
│   │   ├── Client.ts             # + adminId; compound unique phone
│   │   └── Job.ts                # + adminId; indexes
│   ├── routes/auth.ts            # + POST /register; login unchanged semantically
│   ├── routes/clients.ts         # scope by adminId
│   ├── routes/jobs.ts            # scope by adminId
│   ├── routes/categories.ts      # distinct categories for session admin only
│   ├── services/
│   │   ├── migrateOwnership.ts   # one-time orphan adminId assignment
│   │   ├── clientService.ts      # admin-scoped find-or-create
│   │   └── jobService.ts         # set adminId on create; filter on read/update/delete
│   ├── middleware/auth.ts        # already exposes adminId — reuse
│   └── config/env.ts             # ADMIN_* optional or removed after migration path
└── .env.example
```

**Structure Decision**: Зберігаємо split Next.js (`src/`) + Express (`backend/`). Уся ізоляція даних — на backend за `session.adminId`; frontend лише додає реєстрацію й покладається на вже scoped API.

## Complexity Tracking

> Немає порушень constitution/project gates — таблиця не заповнюється.
