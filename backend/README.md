# Backend — Kikvidze Service Manager

Express + TypeScript API (MongoDB). Layout prepared for feature `001-client-job-booking`.

## Structure

```text
backend/src/
├── config/        # env, MongoDB connection
├── models/        # Mongoose models
├── routes/        # HTTP routes
├── middleware/    # auth, validation, errors
├── utils/         # helpers (e.g. phone normalize)
├── services/      # business logic
└── index.ts       # entry point
```

## Scripts

```bash
npm run dev    # tsx watch (needs deps from T002+)
npm run build  # compile to dist/
npm start      # run dist/index.js
```

Dependencies and TypeScript config:

- Copy `.env.example` → `.env` and adjust values
- `tsconfig.json` compiles `src/` → `dist/`
