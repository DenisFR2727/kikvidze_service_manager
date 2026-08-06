import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

/**
 * `/api` router.
 *
 * Mount public routes (login/logout) **before** `requireAuth`.
 * Mount protected resource routes **after** `requireAuth`.
 */
export function createApiRouter(): Router {
  const api = Router();

  // Public auth routes — T017 (`/auth/login`, `/auth/logout`)

  api.use(requireAuth);

  // Protected routes — later tasks (`/auth/me`, clients, jobs, categories)

  return api;
}
