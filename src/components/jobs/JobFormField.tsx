"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export type JobFormFieldStyles = {
  field: string;
  fieldFull?: string;
  label: string;
  required: string;
  input: string;
  fieldError: string;
};

export type JobFormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  requiredMark: string;
  error?: string;
  styles: JobFormFieldStyles;
  fullWidth?: boolean;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  afterInput?: ReactNode;
};

export function JobFormField({
  id,
  label,
  required = false,
  requiredMark,
  error,
  styles,
  fullWidth = false,
  inputProps,
  afterInput,
}: JobFormFieldProps) {
  const errorId = `${id}-error`;
  const className =
    fullWidth && styles.fieldFull
      ? `${styles.field} ${styles.fieldFull}`
      : styles.field;

  return (
    <div className={className}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <>
            {" "}
            <span className={styles.required}>{requiredMark}</span>
          </>
        ) : null}
      </label>
      <input
        id={id}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {afterInput}
      {error ? (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
