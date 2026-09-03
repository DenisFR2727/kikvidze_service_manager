import { uk } from "../../lib/i18n/uk.ts";
import type { LoginRequest, RegisterRequest } from "../../lib/types.ts";

/** Matches backend `MIN_PASSWORD_LENGTH` in `backend/src/routes/auth.ts`. */
export const MIN_PASSWORD_LENGTH = 8;

export type LoginFormState = {
  login: string;
  password: string;
};

export type LoginFieldKey = keyof LoginFormState;
export type LoginFieldErrors = Partial<Record<LoginFieldKey, string>>;

export type RegisterFormState = {
  login: string;
  password: string;
  passwordConfirm: string;
};

export type RegisterFieldKey = keyof RegisterFormState;
export type RegisterFieldErrors = Partial<Record<RegisterFieldKey, string>>;

export function emptyLoginForm(): LoginFormState {
  return { login: "", password: "" };
}

export function emptyRegisterForm(): RegisterFormState {
  return { login: "", password: "", passwordConfirm: "" };
}

export function validateLoginForm(
  form: LoginFormState,
): { payload?: LoginRequest; errors: LoginFieldErrors } {
  const errors: LoginFieldErrors = {};
  const login = form.login.trim();

  if (!login) {
    errors.login = uk.auth.loginRequired;
  }
  if (!form.password) {
    errors.password = uk.auth.passwordRequired;
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors: {},
    payload: { login, password: form.password },
  };
}

export function validateRegisterForm(
  form: RegisterFormState,
): { payload?: RegisterRequest; errors: RegisterFieldErrors } {
  const errors: RegisterFieldErrors = {};
  const login = form.login.trim();

  if (!login) {
    errors.login = uk.auth.loginRequired;
  }
  if (!form.password) {
    errors.password = uk.auth.passwordRequired;
  } else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = uk.auth.passwordTooShort;
  }
  if (!form.passwordConfirm) {
    errors.passwordConfirm = uk.auth.passwordConfirmRequired;
  } else if (form.password && form.passwordConfirm !== form.password) {
    errors.passwordConfirm = uk.auth.passwordMismatch;
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors: {},
    payload: { login, password: form.password },
  };
}
