import { Router, type Request, type Response } from "express";
import { requireAdminSession } from "../middleware/auth.js";
import { Job } from "../models/Job.js";

async function listCategoriesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const session = requireAdminSession(req);
  const raw = await Job.distinct("category", { adminId: session.adminId }).exec();
  const items = raw
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .sort((a, b) => a.localeCompare(b, "uk"));

  res.status(200).json({ items });
}

export function createCategoriesRouter(): Router {
  const router = Router();
  router.get("/", listCategoriesHandler);
  return router;
}
