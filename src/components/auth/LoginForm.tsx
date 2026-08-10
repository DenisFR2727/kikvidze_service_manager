"use client";

import { useState } from "react";
import { uk } from "@/lib/i18n/uk";
import type { LoginRequest } from "@/lib/types";
import styles from "./LoginForm.module.scss";

export type LoginFormProps = {
  /** Called with trimmed credentials; reject/throw to show an error. */
  onSubmit: (values: LoginRequest) => void | Promise<void>;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    login?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextLogin = login.trim();
    const nextErrors: { login?: string; password?: string } = {};

    if (!nextLogin) {
      nextErrors.login = uk.auth.loginRequired;
    }
    if (!password) {
      nextErrors.password = uk.auth.passwordRequired;
    }

    setFieldErrors(nextErrors);
    setFormError(null);

    if (nextErrors.login || nextErrors.password) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({ login: nextLogin, password });
    } catch (err) {
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
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login">
          {uk.auth.login}
        </label>
        <input
          id="login"
          className={styles.input}
          name="login"
          type="text"
          autoComplete="username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.login)}
          aria-describedby={fieldErrors.login ? "login-error" : undefined}
        />
        {fieldErrors.login ? (
          <p id="login-error" className={styles.fieldError} role="alert">
            {fieldErrors.login}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          {uk.auth.password}
        </label>
        <input
          id="password"
          className={styles.input}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password ? (
          <p id="password-error" className={styles.fieldError} role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

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
