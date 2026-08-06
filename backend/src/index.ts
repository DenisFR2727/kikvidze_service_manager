import cookieSession from "cookie-session";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { SESSION_COOKIE_NAME } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createApiRouter } from "./routes/api.js";
import { seedAdminIfMissing } from "./services/seedAdmin.js";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(
    cookieSession({
      name: SESSION_COOKIE_NAME,
      keys: [env.SESSION_SECRET],
      maxAge: SESSION_MAX_AGE_MS,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      signed: true,
    }),
  );

  app.use("/api", createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function main(): Promise<void> {
  await connectDB();
  await seedAdminIfMissing();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
