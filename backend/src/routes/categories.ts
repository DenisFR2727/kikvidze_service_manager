import { Router, type Request, type Response } from "express";
import { Job } from "../models/Job.js";

async function listCategoriesHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  const raw = await Job.distinct("category").exec();
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
