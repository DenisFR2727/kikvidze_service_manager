import type { Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { AppError } from "./errorHandler.js";

const LOGIN_WINDOW_MS = 3 * 60 * 1000; // 3 minutes
const REGISTER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const LOGIN_RATE_LIMIT_MESSAGE =
  "Too many attempts. Try again in 3 minutes.";
const REGISTER_RATE_LIMIT_MESSAGE = "Too many attempts. Try again later.";

function makeRateLimitedHandler(message: string) {
  return (
    _req: Request,
    _res: Response,
    next: (err?: unknown) => void,
  ): void => {
    next(
      new AppError("RATE_LIMITED", message, {
        status: 429,
      }),
    );
  };
}

function clientIpKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return ipKeyGenerator(ip);
}

/**
 * Per-IP limiter for `POST /auth/login`.
 * Failed attempts only — successful logins do not consume the budget.
 */
export const loginIpRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:ip:${clientIpKey(req)}`,
  handler: makeRateLimitedHandler(LOGIN_RATE_LIMIT_MESSAGE),
});

/**
 * Per-login limiter (after body validation). Caps brute-force against one
 * account across different IPs.
 */
export const loginAccountRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const login =
      typeof req.body?.login === "string" ? req.body.login.trim().toLowerCase() : "";
    return `login:account:${login || "unknown"}`;
  },
  handler: makeRateLimitedHandler(LOGIN_RATE_LIMIT_MESSAGE),
});

/**
 * Per-IP limiter for `POST /auth/register` — tighter to reduce spam accounts.
 * Counts every attempt (success and failure).
 */
export const registerIpRateLimit = rateLimit({
  windowMs: REGISTER_WINDOW_MS,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `register:ip:${clientIpKey(req)}`,
  handler: makeRateLimitedHandler(REGISTER_RATE_LIMIT_MESSAGE),
});
