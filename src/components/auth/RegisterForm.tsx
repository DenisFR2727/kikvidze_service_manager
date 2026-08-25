"use client";

import { useState } from "react";
import { uk } from "@/lib/i18n/uk";
import type { RegisterRequest } from "@/lib/types";
import styles from "./LoginForm.module.scss";

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
      <div className={styles.field}>
        <label className={styles.label} htmlFor="register-login">
          {uk.auth.login}
        </label>
        <input
          id="register-login"
          className={styles.input}
          name="login"
          type="text"
          autoComplete="username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.login)}
          aria-describedby={
            fieldErrors.login ? "register-login-error" : undefined
          }
        />
        {fieldErrors.login ? (
          <p id="register-login-error" className={styles.fieldError} role="alert">
            {fieldErrors.login}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="register-password">
          {uk.auth.password}
        </label>
        <input
          id="register-password"
          className={styles.input}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "register-password-error" : undefined
          }
        />
        {fieldErrors.password ? (
          <p
            id="register-password-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="register-password-confirm">
          {uk.auth.passwordConfirm}
        </label>
        <input
          id="register-password-confirm"
          className={styles.input}
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          disabled={isPending}
          aria-invalid={Boolean(fieldErrors.passwordConfirm)}
          aria-describedby={
            fieldErrors.passwordConfirm
              ? "register-password-confirm-error"
              : undefined
          }
        />
        {fieldErrors.passwordConfirm ? (
          <p
            id="register-password-confirm-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.passwordConfirm}
          </p>
        ) : null}
      </div>

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
