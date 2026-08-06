import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  clearAdminSession,
  getAdminSession,
  requireAuth,
  setAdminSession,
} from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { Admin } from "../models/Admin.js";

const loginBodySchema = z.object({
  login: z.string().trim().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type LoginBody = z.infer<typeof loginBodySchema>;

async function loginHandler(req: Request, res: Response): Promise<void> {
  const { login, password } = req.body as LoginBody;

  const admin = await Admin.findOne({ login }).exec();
  const passwordOk =
    admin !== null && (await bcrypt.compare(password, admin.passwordHash));

  if (!admin || !passwordOk) {
    throw new AppError("UNAUTHORIZED", "Invalid login or password");
  }

  setAdminSession(req, {
    adminId: String(admin._id),
    login: admin.login,
  });

  res.status(200).json({
    ok: true,
    admin: { login: admin.login },
  });
}

function logoutHandler(req: Request, res: Response): void {
  clearAdminSession(req);
  res.status(200).json({ ok: true });
}

function meHandler(req: Request, res: Response): void {
  const session = getAdminSession(req);
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }

  res.status(200).json({
    admin: { login: session.login },
  });
}

/**
 * Auth routes:
 * - `POST /login`, `POST /logout` — public
 * - `GET /me` — requires session (`requireAuth`)
 */
export function createAuthRouter(): Router {
  const router = Router();

  router.post("/login", validateBody(loginBodySchema), loginHandler);
  router.post("/logout", logoutHandler);
  router.get("/me", requireAuth, meHandler);

  return router;
}
