import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createAuthRouter } from "./auth.js";

/**
 * `/api` router.
 *
 * Mount public routes (login/logout) **before** `requireAuth`.
 * Mount protected resource routes **after** `requireAuth`.
 *
 * Auth mounts as a whole under `/auth`: login/logout are public handlers;
 * `/auth/me` applies `requireAuth` on the route itself.
 */
export function createApiRouter(): Router {
  const api = Router();

  api.use("/auth", createAuthRouter());

  api.use(requireAuth);

  // Protected routes — later tasks (clients, jobs, categories)

  return api;
}
