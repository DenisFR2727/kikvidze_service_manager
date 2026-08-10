# Backend — Kikvidze Service Manager

Express + TypeScript API (MongoDB) for feature `001-client-job-booking`.

## Prerequisites

- Node.js 22+
- MongoDB running locally (or Atlas URI)

## Environment

Copy `.env.example` → `.env` and adjust values:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/kikvidze_service_manager
ADMIN_LOGIN=admin
ADMIN_PASSWORD=change-me
SESSION_SECRET=dev-secret-min-32-chars!!!!!!!!!!!!
CORS_ORIGIN=http://localhost:3000
```

## Install & start

```bash
cd backend
npm install
npm run dev
```

API: http://localhost:4000

The Next.js UI (repo root) must run separately with `NEXT_PUBLIC_API_URL=http://localhost:4000` — see root `README.md` and `specs/001-client-job-booking/quickstart.md`.

## Scripts

```bash
npm run dev    # tsx watch
npm run build  # compile to dist/
npm start      # run dist/index.js
```

## Structure

```text
backend/src/
├── config/        # env, MongoDB connection
├── models/        # Mongoose models
├── routes/        # HTTP routes
├── middleware/    # auth, validation, errors
├── schemas/       # Zod request schemas
├── utils/         # helpers (e.g. phone normalize)
├── services/      # business logic
└── index.ts       # entry point
```
