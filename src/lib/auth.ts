import { ApiError, apiClient } from "@/lib/api-client";
import type {
  Admin,
  LoginRequest,
  LoginResponse,
  MeResponse,
  OkResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/types";

/** Unauthenticated users are sent here (app shell gate). */
export const LOGIN_PATH = "/login";

/** Self-registration screen. */
export const REGISTER_PATH = "/register";

/** Destination after successful login or registration. */
export const APP_HOME_PATH = "/";

/**
 * Current admin from `GET /api/auth/me`.
 * Returns `null` on 401; rethrows other errors.
 */
export async function getMe(): Promise<Admin | null> {
  try {
    const data = await apiClient.get<MeResponse>("/api/auth/me");
    return data.admin;
  } catch (err) {
    if (err instanceof ApiError && err.isUnauthorized) {
      return null;
    }
    throw err;
  }
}

/** `true` when the error means the session is missing/invalid. */
export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiError && err.isUnauthorized;
}

export async function login(values: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/api/auth/login", values);
}

export async function register(
  values: RegisterRequest,
): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>("/api/auth/register", values);
}

export async function logout(): Promise<OkResponse> {
  return apiClient.post<OkResponse>("/api/auth/logout");
}
