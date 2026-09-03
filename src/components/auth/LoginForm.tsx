"use client";

import { useState } from "react";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthSubmitError } from "@/components/auth/authApiErrors";
import {
  emptyLoginForm,
  validateLoginForm,
  type LoginFieldErrors,
  type LoginFormState,
} from "@/components/auth/authFormValidation";
import { uk } from "@/lib/i18n/uk";
import type { LoginRequest } from "@/lib/types";
import styles from "./AuthForm.module.scss";

export type LoginFormProps = {
  /** Called with trimmed credentials; reject/throw to show an error. */
  onSubmit: (values: LoginRequest) => void | Promise<void>;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [form, setForm] = useState<LoginFormState>(() => emptyLoginForm());
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function updateField<K extends keyof LoginFormState>(
    key: K,
    value: LoginFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const { payload, errors } = validateLoginForm(form);
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
          : uk.auth.loginFailed;
      setFormError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <AuthFormField
        id="login"
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
        id="password"
        label={uk.auth.password}
        error={fieldErrors.password}
        inputProps={{
          name: "password",
          type: "password",
          autoComplete: "current-password",
          value: form.password,
          onChange: (e) => updateField("password", e.target.value),
          disabled: isPending,
        }}
      />

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={isPending}>
        {isPending ? uk.auth.submitting : uk.auth.submit}
      </button>
    </form>
  );
}
