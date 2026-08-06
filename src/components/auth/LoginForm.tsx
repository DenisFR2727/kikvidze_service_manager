"use client";

import { useState, type FormEvent } from "react";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextLogin = login.trim();
    const nextErrors: { login?: string; password?: string } = {};

    if (!nextLogin) {
      nextErrors.login = "Вкажіть логін";
    }
    if (!password) {
      nextErrors.password = "Вкажіть пароль";
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
          : "Не вдалося увійти. Спробуйте ще раз.";
      setFormError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login">
          Логін
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
          Пароль
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
        {isPending ? "Вхід…" : "Увійти"}
      </button>
    </form>
  );
}
