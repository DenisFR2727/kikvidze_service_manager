# Implementation Plan: Client Job Booking

**Branch**: `001-client-job-booking` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-client-job-booking/spec.md`

## Summary

Адмін-додаток для майстерні: захищений вхід одного адміна, облік клієнтів (унікальний телефон) і робіт (статуси, ціни, дати), головна зі списком за замовчуванням і перемикачем на календар, фільтри/пошук, картка роботи з редагуванням і видаленням.

**Технічний підхід**: Next.js 16 (App Router) + React + TypeScript + SCSS на фронті; окремий Node.js API в `backend/` з MongoDB (Mongoose); автентифікація одного адміна через логін/пароль і httpOnly session cookie; REST JSON API для CRUD клієнтів/робіт.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend), Node.js 22.x

**Primary Dependencies**: Next.js 16.3, React 19, Sass; Express + Mongoose + bcrypt + cookie-session (або express-session) на backend; Zod для валідації DTO

**Storage**: MongoDB (collections: `admins`, `clients`, `jobs`)

**Testing**: Backend — Vitest + Supertest (API contract/integration); Frontend — Playwright smoke для login + create job (мінімум у quickstart); `npm run lint` / `tsc` як базові перевірки

**Target Platform**: Web (desktop-first, mobile-responsive), браузер сучасний Chromium/Firefox/Safari

**Project Type**: Web application (Next.js frontend + Express API backend)

**Performance Goals**: Створення/оновлення запису < 1 с відчутного очікування; пошук/фільтр списку до ~5k робіт < 2 с; вхід < 30 с end-to-end (SC-009)

**Constraints**: Один адмін; без публічного клієнтського кабінету; UAH only; дозволені overlapping time slots; пароль адміна не в клієнтському бандлі (env/DB hash)

**Scale/Scope**: Одна майстерня, сотні–тисячі робіт на рік; екрани: login, home (list/calendar + filters + create), job detail (edit/delete)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` зараз є незаповненим шаблоном (placeholder principles). Тому гейти застосовуються як **project defaults** із існуючого репо та спеки:

| Gate | Status | Notes |
|------|--------|-------|
| Align with declared stack (Next/TS/SCSS + MongoDB backend stub) | PASS | Не вводимо альтернативний стек |
| Keep scope to single-admin workshop app | PASS | Без multi-tenant / client portal |
| Prefer simple over premature abstraction | PASS | Один API сервіс, три основні сутності |
| Spec-driven: FR covered by data model + contracts | PASS | Phase 1 artifacts map to FR |
| No unjustified microservices / extra apps | PASS | Frontend + one backend only |

**Post-Phase 1 re-check**: PASS — design adds only Client/Job/Admin models and REST contracts; no new deployable units beyond existing `src/` + `backend/`.

## Project Structure

### Documentation (this feature)

```text
specs/001-client-job-booking/
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
│   ├── (auth)/login/             # Login screen
│   ├── (app)/                    # Authenticated shell
│   │   ├── page.tsx              # Home: list default + calendar switch
│   │   └── jobs/[id]/page.tsx   # Job detail card
│   ├── layout.tsx
│   ├── globals.scss
│   └── api/                      # Optional BFF proxies (prefer direct backend URL)
├── components/
│   ├── jobs/                     # JobList, JobForm, JobCard, JobFilters, JobCalendar
│   ├── clients/                  # Client hints / search results
│   └── auth/                     # LoginForm
├── lib/
│   ├── api-client.ts             # Typed fetch to backend
│   └── auth.ts                   # Session helpers (cookie-aware)
└── styles/                       # Shared SCSS partials

backend/
├── src/
│   ├── index.ts                  # Express entry
│   ├── config/
│   │   ├── db.ts                 # Mongo connect
│   │   └── env.ts
│   ├── models/
│   │   ├── Admin.ts
│   │   ├── Client.ts
│   │   └── Job.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── clients.ts
│   │   ├── jobs.ts
│   │   └── categories.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validate.ts
│   └── utils/
│       └── phone.ts              # Normalize phone for uniqueness/search
├── package.json
└── .env.example

public/
```

**Structure Decision**: Зберігаємо вже створений split — Next.js у корені (`src/`) і API-заготовку в `backend/`. Frontend не пише напряму в MongoDB; усі мутації йдуть через backend REST.

## Complexity Tracking

> Немає порушень constitution/project gates — таблиця не заповнюється.
