import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createAuthRouter } from "./auth.js";
import { createCategoriesRouter } from "./categories.js";
import { createClientsRouter } from "./clients.js";
import { createJobsRouter } from "./jobs.js";

/**
 * `/api` router.
 *
 * Mount public auth routes (register / login / logout) **before** `requireAuth`.
 * Mount protected resource routes **after** `requireAuth`.
 *
 * Auth mounts under `/auth`: register, login, and logout are public;
 * `/auth/me` applies `requireAuth` on the route itself.
 *
 * Jobs, clients, and categories are always scoped to the session `adminId`
 * (create stamps ownership; get/patch/delete of another admin’s id → `404`).
 * See `specs/002-admin-registration/contracts/api.md`.
 */
export function createApiRouter(): Router {
  const api = Router();

  api.use("/auth", createAuthRouter());

  api.use(requireAuth);

  api.use("/jobs", createJobsRouter());
  api.use("/clients", createClientsRouter());
  api.use("/categories", createCategoriesRouter());

  return api;
}
