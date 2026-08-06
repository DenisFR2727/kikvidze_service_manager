# Kikvidze Service Manager

Адмін-додаток майстерні: записи клієнтів на роботи (Next.js UI + Express/MongoDB API).

## Stack

- **Next.js** 16 (App Router) + **React** 19 + **TypeScript** + **SCSS**
- **Backend** — Express + Mongoose + MongoDB (`backend/`)

## Getting Started (dual process)

Потрібні **два** процеси: API на `:4000` і UI на `:3000`.

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

### 2. Install

```bash
npm install
cd backend
npm install
cd ..
```

### 3. Run

**Термінал A — API:**

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

## Project structure

```text
├── src/              # Next.js App Router frontend
├── backend/          # Express + MongoDB API
├── specs/            # Spec Kit feature docs
├── .env.local.example
└── package.json
```
