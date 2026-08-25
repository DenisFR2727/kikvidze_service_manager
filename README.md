# Kikvidze Service Manager

Адмін-додаток майстерні: записи клієнтів на роботи (Next.js UI + Express/MongoDB API).

## Stack

- **Next.js** 16 (App Router) + **React** 19 + **TypeScript** + **SCSS**
- **Backend** — Express + Mongoose + MongoDB (`backend/`)

## Getting Started (dual process)

Потрібні **два** процеси: API на `:4000` і UI на `:3000`.

Див. також:

- [`specs/001-client-job-booking/quickstart.md`](./specs/001-client-job-booking/quickstart.md) — роботи / клієнти
- [`specs/002-admin-registration/quickstart.md`](./specs/002-admin-registration/quickstart.md) — реєстрація адміна та ізоляція даних

### 1. Env

```bash
# Frontend
copy .env.local.example .env.local

# Backend
cd backend
copy .env.example .env
cd ..
```

На macOS/Linux: `cp` замість `copy`.

Переконайся, що MongoDB запущена і `MONGODB_URI` у `backend/.env` коректний.

**`backend/.env`** (приклад):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/kikvidze_service_manager
SESSION_SECRET=dev-secret-min-32-chars!!!!!!!!!!!!
CORS_ORIGIN=http://localhost:3000
```

**Root `.env.local`** (з `.env.local.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. Install

```bash
npm install
cd backend
npm install
cd ..
```

### 3. Run

**Термінал A — API** (prefer `npm run dev` so source changes reload; `npm start` needs a fresh `npm run build` first):

```bash
cd backend
npm run dev
```

**Термінал B — UI:**

```bash
npm run dev
```

- UI: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

Backend details: [`backend/README.md`](./backend/README.md).

### 4. Auth (перший адмін)

Облікові дані **не** задаються через `ADMIN_LOGIN` / `ADMIN_PASSWORD` у env.

1. Відкрий UI → екран входу → **Зареєструватися** (або `POST /api/auth/register` з `login` + `password`, min 8 символів).
2. Після реєстрації сесія створюється автоматично; далі вхід — логін і пароль зареєстрованого адміна.
3. Кожен адмін бачить лише своїх клієнтів і роботи.

## Project structure

```text
├── src/              # Next.js App Router frontend
├── backend/          # Express + MongoDB API
├── specs/            # Spec Kit feature docs
├── .env.local.example
└── package.json
```
