# Research: Admin Registration & Ownership

**Feature**: `002-admin-registration`  
**Date**: 2026-08-25

## 1. Replace seed-only admin with self-registration

**Decision**: Додати `POST /api/auth/register` (login + password + passwordConfirm на UI; на API — login + password з min length 8). Після успішної реєстрації одразу створювати session cookie (auto-login). Прибрати обов’язковий seed з `ADMIN_LOGIN` / `ADMIN_PASSWORD` як єдиний шлях створення адміна.

**Rationale**: Спека вимагає реальної реєстрації й відмову від фейкових облікових даних; auto-login закриває acceptance «потрапляє в робочу зону» без зайвого кроку.

**Alternatives considered**:
- Лише seed з env без UI register — суперечить FR-001 / User Story 1.
- Register без auto-login (лише redirect на login) — гірший UX; допустимий fallback, але auto-login простіший.
- Invite-only / first-admin bootstrap gate — відхилено Assumptions спеки (open self-registration).

## 2. Password hashing & validation

**Decision**: Залишити bcrypt (існуючі rounds у seed/login). Валідація: login trim, non-empty, unique; password min 8; UI вимагає passwordConfirm match перед submit; API повторно перевіряє min length (не обов’язково приймати confirm у body).

**Rationale**: Уже є bcrypt у login path; мінімум 8 — Assumption спеки; confirm лише UX-шар зменшує помилки без ускладнення API.

**Alternatives considered**:
- argon2 — кращий сучасний default, але зайва зміна залежності для цієї фічі.
- Password complexity rules (uppercase/symbols) — не в спекі; overkill для workshop MVP.

## 3. Retire fake / env-seed credentials

**Decision**: `seedAdminIfMissing` більше не створює адміна при порожній колекції в нормальному runtime. `ADMIN_LOGIN` / `ADMIN_PASSWORD` стають опційними (або видаляються з required env). Вхід можливий лише для документів у `admins`, створених через register. Якщо потрібна one-time міграція orphaned data — окремий startup helper (не credentials login).

**Rationale**: FR-004 — фейкові/захардкоджені дані не дають доступу; env seed був саме тим механізмом «фейкового» єдиного адміна.

**Alternatives considered**:
- Залишити seed як bootstrap «першого» адміна + UI register для наступних — розмиває «реєстрація» і залишає shared secret у env.
- Hard-fail якщо немає адмінів — зайве; порожня БД просто вимагає register.

## 4. Ownership model (adminId on Client & Job)

**Decision**: Додати обов’язкове поле `adminId` (ObjectId → Admin) на `Client` і `Job`. Усі create проставляють `adminId` з session. Усі list/get/update/delete/search/categories фільтрують за `adminId`. Доступ до чужого id → `404 NOT_FOUND` (без витоку існування).

**Rationale**: FR-008–010; простіше й надійніше enforce на сервері, ніж покладатися на UI.

**Alternatives considered**:
- Ownership лише на Job, Client глобальний — суперечить FR-011 (phone unique per admin) і «робота з клієнтами» per admin.
- Soft multi-tenant `workshopId` — premature; спека = per-admin isolation, не організації.

## 5. Phone uniqueness per admin

**Decision**: Замінити unique index на `Client.phoneNormalized` на compound unique `{ adminId: 1, phoneNormalized: 1 }`. Find-or-create клієнта завжди в межах session admin.

**Rationale**: FR-011; два адміни можуть мати клієнта з тим самим телефоном незалежно.

**Alternatives considered**:
- Глобальна унікальність телефону — ламає ізоляцію й acceptance scenario 5.
- Окремі DB per admin — надмірно для однієї інсталяції.

## 6. Migration of existing unowned records

**Decision**: One-time startup (або explicit migrate script invoked on boot once): якщо існують `clients`/`jobs` без `adminId`, після появи хоча б одного Admin — присвоїти їх першому адміну за `createdAt` (oldest). Доки адмінів немає — orphaned records недоступні через API (немає session owner). Нові записи завжди з `adminId`.

**Rationale**: Assumption спеки; захищає dev/prod дані після schema change без ручного Mongo hacking.

**Alternatives considered**:
- Видалити orphaned data — деструктивно.
- Залишити без owner і показувати всім — суперечить ізоляції.
- Прив’язка лише після першого login конкретного seed login — seed прибираємо.

## 7. Session shape

**Decision**: Зберегти існуючу cookie-session (`sid`) з `adminId` + `login`. Register і login викликають `setAdminSession`. Logout — `clearAdminSession`. Frontend `AuthGate` / `getMe` без зміни контракту (опційно додати `id` у `/me` для дебагу — не обов’язково для MVP).

**Rationale**: Middleware уже носить `adminId`; ownership enforcement лише потребує послідовного використання.

**Alternatives considered**: JWT — відхилено в 001 research; не переглядаємо.

## 8. Frontend registration UX

**Decision**: Новий route `(auth)/register` + `RegisterForm` (login, password, passwordConfirm). Login page — лінк «Зареєструватися»; register — «Увійти». Після успішного register — `router.replace(APP_HOME_PATH)` (сесія вже встановлена). i18n рядки в `uk.ts`.

**Rationale**: FR-012, User Story 4; узгоджено з існуючим login flow.

**Alternatives considered**: Модалка реєстрації на login — гірше для deep-link і простоти.

## 9. Categories & search scoping

**Decision**: `GET /api/categories` і всі job/client queries включають filter `adminId = session.adminId`. Інакше категорії/пошук витікали б між адмінами.

**Rationale**: Побічний канал витоку даних без явного FR, але необхідний для SC-003.

**Alternatives considered**: Глобальні categories — відхилено (витік бізнес-даних).

## 10. Testing focus

**Decision**: Contract/integration tests: register success/duplicate/weak password; login rejects unknown; admin A creates job; admin B list empty / get-by-id 404. Quickstart manual dual-admin scenario.

**Rationale**: Ownership bugs — найризикованіша частина фічі; auth paths уже частково покриті патерном 001.
