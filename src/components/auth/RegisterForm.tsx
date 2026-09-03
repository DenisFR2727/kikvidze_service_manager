"use client";

import { useState } from "react";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthSubmitError } from "@/components/auth/authApiErrors";
import {
  emptyRegisterForm,
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormState,
} from "@/components/auth/authFormValidation";
import { uk } from "@/lib/i18n/uk";
import type { RegisterRequest } from "@/lib/types";
import styles from "./AuthForm.module.scss";

export type RegisterFormProps = {
  /** Called with trimmed credentials; reject/throw to show an error. */
  onSubmit: (values: RegisterRequest) => void | Promise<void>;
};

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [form, setForm] = useState<RegisterFormState>(() => emptyRegisterForm());
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function updateField<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const { payload, errors } = validateRegisterForm(form);
    setFieldErrors(errors);
    setFormError(null);

    if (!payload) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof AuthSubmitError) {
        if (err.fieldErrors) {
          setFieldErrors((current) => ({ ...current, ...err.fieldErrors }));
        }
        if (err.formError) {
          setFormError(err.formError);
        }
        return;
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : uk.auth.registerFailed;
      setFormError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <AuthFormField
        id="register-login"
        label={uk.auth.login}
        error={fieldErrors.login}
        inputProps={{
          name: "login",
          type: "text",
          autoComplete: "username",
          value: form.login,
          onChange: (e) => updateField("login", e.target.value),
          disabled: isPending,
        }}
      />

      <AuthFormField
        id="register-password"
        label={uk.auth.password}
        error={fieldErrors.password}
        inputProps={{
          name: "password",
          type: "password",
          autoComplete: "new-password",
          value: form.password,
          onChange: (e) => updateField("password", e.target.value),
          disabled: isPending,
        }}
      />

      <AuthFormField
        id="register-password-confirm"
        label={uk.auth.passwordConfirm}
        error={fieldErrors.passwordConfirm}
        inputProps={{
          name: "passwordConfirm",
          type: "password",
          autoComplete: "new-password",
          value: form.passwordConfirm,
          onChange: (e) => updateField("passwordConfirm", e.target.value),
          disabled: isPending,
        }}
      />

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={isPending}>
        {isPending ? uk.auth.registerSubmitting : uk.auth.registerSubmit}
      </button>
    </form>
  );
}
