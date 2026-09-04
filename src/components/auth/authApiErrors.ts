import { ApiError } from "../../lib/api-client.ts";
import { uk } from "../../lib/i18n/uk.ts";
import type { LoginFieldErrors, RegisterFieldErrors } from "./authFormValidation";

export class AuthSubmitError extends Error {
  readonly formError?: string;
  readonly fieldErrors?: LoginFieldErrors | RegisterFieldErrors;

  constructor(options: {
    formError?: string;
    fieldErrors?: LoginFieldErrors | RegisterFieldErrors;
  }) {
    super(options.formError ?? "");
    this.name = "AuthSubmitError";
    this.formError = options.formError;
    this.fieldErrors = options.fieldErrors;
  }
}

export function mapLoginApiError(err: unknown): AuthSubmitError | null {
  if (!(err instanceof ApiError)) {
    return null;
  }

  if (err.code === "RATE_LIMITED" || err.status === 429) {
    return new AuthSubmitError({ formError: uk.auth.rateLimited });
  }

  if (err.isUnauthorized) {
    return new AuthSubmitError({ formError: uk.auth.invalidCredentials });
  }

  if (err.code === "NETWORK" || err.code === "UNKNOWN" || err.code === "INTERNAL") {
    return new AuthSubmitError({ formError: uk.auth.loginFailed });
  }

  if (err.fields && Object.keys(err.fields).length > 0) {
    return new AuthSubmitError({
      formError: err.message || uk.auth.loginFailed,
      fieldErrors: mapApiFieldsToLoginErrors(err.fields),
    });
  }

  return new AuthSubmitError({
    formError: err.message || uk.auth.loginFailed,
  });
}

export function mapRegisterApiError(err: unknown): AuthSubmitError | null {
  if (!(err instanceof ApiError)) {
    return null;
  }

  if (err.code === "RATE_LIMITED" || err.status === 429) {
    return new AuthSubmitError({ formError: uk.auth.rateLimited });
  }

  if (err.code === "CONFLICT") {
    return new AuthSubmitError({
      fieldErrors: { login: uk.auth.loginTaken },
    });
  }

  if (err.code === "VALIDATION_ERROR") {
    const fieldErrors = mapApiFieldsToRegisterErrors(err.fields);
    if (Object.keys(fieldErrors).length > 0) {
      return new AuthSubmitError({ fieldErrors });
    }
    return new AuthSubmitError({
      formError: err.message || uk.auth.registerFailed,
    });
  }

  if (err.code === "NETWORK" || err.code === "UNKNOWN" || err.code === "INTERNAL") {
    return new AuthSubmitError({ formError: uk.auth.registerFailed });
  }

  return new AuthSubmitError({
    formError: err.message || uk.auth.registerFailed,
  });
}

function mapApiFieldsToLoginErrors(
  fields: Record<string, string>,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (fields.login) {
    errors.login = uk.auth.loginRequired;
  }
  if (fields.password) {
    errors.password = uk.auth.passwordRequired;
  }

  return errors;
}

function mapApiFieldsToRegisterErrors(
  fields: Record<string, string> | undefined,
): RegisterFieldErrors {
  if (!fields) {
    return {};
  }

  const errors: RegisterFieldErrors = {};

  if (fields.login) {
    errors.login = uk.auth.loginTaken;
  }
  if (fields.password) {
    errors.password = uk.auth.passwordTooShort;
  }

  return errors;
}
