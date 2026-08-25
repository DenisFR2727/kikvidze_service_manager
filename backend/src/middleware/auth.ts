/// <reference types="cookie-session" />

import type { Request, RequestHandler } from "express";
import { AppError } from "./errorHandler.js";

/** Cookie name from contracts/api.md — configure cookie-session with the same name. */
export const SESSION_COOKIE_NAME = "sid";

export type AdminSession = {
  adminId: string;
  login: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Read authenticated admin from the cookie session, or `null` if absent/invalid. */
export function getAdminSession(req: Request): AdminSession | null {
  const session = req.session;
  if (!session) {
    return null;
  }

  const { adminId, login } = session;
  if (!isNonEmptyString(adminId) || !isNonEmptyString(login)) {
    return null;
  }

  return { adminId, login };
}

/**
 * Require an authenticated admin session and return it.
 * Throws `401 UNAUTHORIZED` when the session is missing or incomplete.
 */
export function requireAdminSession(req: Request): AdminSession {
  const session = getAdminSession(req);
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }
  return session;
}

/** Persist admin identity on the session cookie (call after successful login). */
export function setAdminSession(req: Request, admin: AdminSession): void {
  if (!req.session) {
    throw new AppError("INTERNAL", "Session middleware is not configured");
  }

  req.session.adminId = admin.adminId;
  req.session.login = admin.login;
}

/** Clear the session cookie (logout). */
export function clearAdminSession(req: Request): void {
  req.session = null;
}

/**
 * Require an authenticated admin session.
 * Responds with `401 UNAUTHORIZED` when the session is missing or incomplete.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    requireAdminSession(req);
    next();
  } catch (error) {
    next(error);
  }
};
