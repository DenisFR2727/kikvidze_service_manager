# Research: Client Job Booking

**Feature**: `001-client-job-booking`  
**Date**: 2026-08-06

## 1. Frontend ↔ Backend boundary

**Decision**: Окремий Express API в `backend/` + Next.js UI в `src/`. UI викликає REST (JSON) з `credentials: 'include'`.

**Rationale**: У проєкті вже є stub `backend/` під MongoDB; спека вимагає постійного сховища. Розділення спрощує auth cookie, валідацію та майбутній деплой API окремо від статики.

**Alternatives considered**:
- Next.js Route Handlers + Mongo напряму в одному процесі — менше рухомих частин, але змішує UI і data layer; суперечить наявній структурі `backend/`.
- Server Actions only — гірше для явного API-контракту і незалежного тестування backend.

## 2. MongoDB ODM

**Decision**: Mongoose + TypeScript models для `Admin`, `Client`, `Job`.

**Rationale**: Зрілий ODM для MongoDB, схеми/валідація/індекси (унікальний телефон) з коробки, добре лягає на Node/Express.

**Alternatives considered**:
- Native MongoDB driver — менше залежностей, більше ручної валідації.
- Prisma MongoDB — зручний DX, але зайва складність для простої схеми v1.

## 3. Admin authentication

**Decision**: Один адмін: логін/пароль (пароль — bcrypt hash у Mongo або seed з env при першому старті). Сесія через **httpOnly + Secure(sameSite) cookie** (express-session або signed cookie з session id). Middleware `requireAuth` на всіх `/api/*` крім `POST /api/auth/login`.

**Rationale**: Спека — один адмін без ролей; cookie session простіша за JWT refresh flow і захищає від XSS-крадіжки токена з JS.

**Alternatives considered**:
- NextAuth/Auth.js — надлишково для одного credentials-користувача.
- JWT у localStorage — гірший XSS profile.
- HTTP Basic — незручно для SPA UX і logout.

## 4. Client identity & phone uniqueness

**Decision**: Окрема колекція `clients` з `phoneNormalized` (унікальний індекс). При create/update job: upsert клієнта за телефоном. Телефон нормалізується (лише цифри / E.164-подібний UA формат) перед порівнянням.

**Rationale**: FR-023/024; уникає дублікатів і підтримує історію робіт.

**Alternatives considered**:
- Денормалізація телефону лише в Job — відхилено спекою (окремий Client).
- Окремі Vehicle entities — поза scope (авто на Job).

## 5. Job status & completedAt

**Decision**: Enum статусів: `queued` | `in_progress` | `done` | `cancelled` (UI labels українською). При переході в `done`, якщо `completedAt` порожній — ставити `now`. Довільні переходи між усіма 4 статусами дозволені.

**Rationale**: Відповідає FR-004–006 і edge case про виправлення помилок.

**Alternatives considered**: Жорстка state machine (лише вперед) — відхилено спекою.

## 6. Calendar view granularity

**Decision (resolve deferred FR-030/031)**: Календар v1 = **тижневий вигляд** з навігацією prev/next week; події на релевантній даті/часі. Список лишається default. Місячна сітка — не в MVP (можна додати пізніше без зміни API).

**Rationale**: Для майстерні тиждень найкраще показує завантаженість; місяць гірше для time-of-day.

**Alternatives considered**:
- Лише month grid — гірше для часу доби.
- Day-only — занадто вузько для планування тижня.
- FullCalendar heavy lib — можна lightweight custom week grid на CSS Grid, щоб не тягнути зайве; фінальний вибір UI-бібліотеки на `/speckit-tasks`/`implement`.

## 7. Filtering & search

**Decision**: Query params на `GET /api/jobs`: `status`, `from`, `to`, `q` (підрядок по phone/name/car), `category`. Категорії: `GET /api/categories` = distinct category strings з jobs.

**Rationale**: Один endpoint для list і calendar (однаковий filter set — FR-032).

**Alternatives considered**: Окремі search endpoints — зайве для v1.

## 8. Validation

**Decision**: Zod schemas на backend (і опційно mirror на frontend для UX). Обов’язкові: phone, car, category, scheduledAt, prices ≥ 0.

**Rationale**: FR-013/017; єдина правда на сервері.

## 9. Testing strategy

**Decision**: Backend contract tests проти `contracts/api.md`; мінімальний E2E smoke (login → create job → open card) у Playwright коли UI готовий.

**Rationale**: Найвищий ROI для CRUD API; повний UI test suite не блокує plan.

## 10. Deployment topology (v1 local)

**Decision**: `npm run dev` (Next :3000) + `backend` dev server (:4000). CORS з origin localhost:3000 і credentials. `NEXT_PUBLIC_API_URL=http://localhost:4000`.

**Rationale**: Простий local quickstart; прод-деплой поза scope плану.
