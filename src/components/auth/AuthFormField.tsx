"use client";

import type { InputHTMLAttributes } from "react";
import styles from "./AuthForm.module.scss";

export type AuthFormFieldProps = {
  id: string;
  label: string;
  error?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
};

export function AuthFormField({
  id,
  label,
  error,
  inputProps,
}: AuthFormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
