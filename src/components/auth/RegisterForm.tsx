"use client";

import { useState } from "react";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { uk } from "@/lib/i18n/uk";
import type { RegisterRequest } from "@/lib/types";
import styles from "./AuthForm.module.scss";

const MIN_PASSWORD_LENGTH = 8;

export type RegisterFormProps = {
  /** Called with trimmed credentials; reject/throw to show an error. */
  onSubmit: (values: RegisterRequest) => void | Promise<void>;
};

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    login?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextLogin = login.trim();
    const nextErrors: {
      login?: string;
      password?: string;
      passwordConfirm?: string;
    } = {};

    if (!nextLogin) {
      nextErrors.login = uk.auth.loginRequired;
    }
    if (!password) {
      nextErrors.password = uk.auth.passwordRequired;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = uk.auth.passwordTooShort;
    }
    if (!passwordConfirm) {
      nextErrors.passwordConfirm = uk.auth.passwordConfirmRequired;
    } else if (password && passwordConfirm !== password) {
      nextErrors.passwordConfirm = uk.auth.passwordMismatch;
    }

    setFieldErrors(nextErrors);
    setFormError(null);

    if (
      nextErrors.login ||
      nextErrors.password ||
      nextErrors.passwordConfirm
    ) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({ login: nextLogin, password });
    } catch (err) {
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
          value: login,
          onChange: (e) => setLogin(e.target.value),
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
          value: password,
          onChange: (e) => setPassword(e.target.value),
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
          value: passwordConfirm,
          onChange: (e) => setPasswordConfirm(e.target.value),
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
