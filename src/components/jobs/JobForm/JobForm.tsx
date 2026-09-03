"use client";

import { useEffect, useId, useState } from "react";
import { JobFormField } from "@/components/jobs/JobFormField";
import {
  emptyCreateForm,
  validateCreateForm,
  type CreateFieldErrors,
  type CreateFieldKey,
  type CreateFormState,
} from "@/components/jobs/jobCreateForm";
import {
  clearSuccessFeedback,
  type FormFeedback,
} from "@/components/jobs/jobFormShared";
import { ApiError } from "@/lib/api-client";
import { sanitizePhoneInput } from "@/lib/phone";
import { JOB_STATUS_LABELS, uk } from "@/lib/i18n/uk";
import type { CreateJobInput, Job } from "@/lib/types";
import styles from "./JobForm.module.scss";

export type JobFormProps = {
  /** Called with normalized create payload; return created job for success details. */
  onSubmit: (values: CreateJobInput) => Promise<Job>;
  /** Known categories for suggestions (FR-015). */
  categories: string[];
  /** Called after a successful create so parents can refresh category lists. */
  onCreated?: (job: Job) => void;
};

const fieldStyles = {
  field: styles.field,
  fieldFull: styles.fieldFull,
  label: styles.label,
  required: styles.required,
  input: styles.input,
  fieldError: styles.fieldError,
};

export function JobForm({ onSubmit, categories, onCreated }: JobFormProps) {
  const idPrefix = useId();
  const titleId = `${idPrefix}-title`;
  const categoryListId = `${idPrefix}-category-list`;

  function fieldId(key: CreateFieldKey): string {
    return `${idPrefix}-${key}`;
  }

  const [form, setForm] = useState<CreateFormState>(() => emptyCreateForm());
  const [fieldErrors, setFieldErrors] = useState<CreateFieldErrors>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [isPending, setIsPending] = useState(false);

  function updateField<K extends keyof CreateFormState>(
    key: K,
    value: CreateFormState[K],
  ) {
    setFeedback(clearSuccessFeedback);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFormAfterSuccess() {
    setForm(emptyCreateForm());
    setFieldErrors({});
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const { payload, errors } = validateCreateForm(form);
    setFieldErrors(errors);
    setFeedback(null);

    if (!payload) {
      return;
    }

    setIsPending(true);
    try {
      const result = await onSubmit(payload);
      resetFormAfterSuccess();
      setFeedback({
        type: "success",
        message: uk.job.saveSuccessDetail(
          result.car,
          result.category,
          JOB_STATUS_LABELS[result.status],
        ),
      });
      onCreated?.(result);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors((current) => ({ ...current, ...err.fields }));
      }

      const message =
        err instanceof Error && err.message ? err.message : uk.job.createFailed;
      setFeedback({ type: "error", message });
    } finally {
      setIsPending(false);
    }
  }

  //  clear message after 5 seconds
  useEffect(() => {
    if (!feedback) return;

    const time = setTimeout(() => {
      setFeedback(null);
    }, 3000);

    return () => clearTimeout(time);
  }, [feedback]);

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {uk.job.newTitle}
      </h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          <JobFormField
            id={fieldId("phone")}
            label={uk.job.phone}
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.phone}
            styles={fieldStyles}
            inputProps={{
              name: "phone",
              type: "tel",
              autoComplete: "tel",
              inputMode: "tel",
              placeholder: "+380671112233",
              value: form.phone,
              disabled: isPending,
              onChange: (e) =>
                updateField("phone", sanitizePhoneInput(e.target.value)),
            }}
          />

          <JobFormField
            id={fieldId("name")}
            label={uk.job.clientName}
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.name}
            styles={fieldStyles}
            inputProps={{
              name: "name",
              type: "text",
              autoComplete: "name",
              placeholder: uk.common.optional,
              value: form.name,
              disabled: isPending,
              onChange: (e) => updateField("name", e.target.value),
            }}
          />

          <JobFormField
            id={fieldId("car")}
            label={uk.job.car}
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.car}
            styles={fieldStyles}
            inputProps={{
              name: "car",
              type: "text",
              placeholder: "BMW X5",
              value: form.car,
              disabled: isPending,
              onChange: (e) => updateField("car", e.target.value),
            }}
          />

          <JobFormField
            id={fieldId("category")}
            label={uk.job.category}
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.category}
            styles={fieldStyles}
            inputProps={{
              name: "category",
              type: "text",
              list: categoryListId,
              placeholder: "Пошив сидінь",
              value: form.category,
              disabled: isPending,
              onChange: (e) => updateField("category", e.target.value),
            }}
            afterInput={
              <datalist id={categoryListId}>
                {categories.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            }
          />

          <JobFormField
            id={fieldId("scheduledAt")}
            label={uk.job.scheduledAt}
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.scheduledAt}
            styles={fieldStyles}
            fullWidth
            inputProps={{
              name: "scheduledAt",
              type: "datetime-local",
              value: form.scheduledAtLocal,
              disabled: isPending,
              onChange: (e) => updateField("scheduledAtLocal", e.target.value),
            }}
          />

          <JobFormField
            id={fieldId("workPrice")}
            label={uk.job.workPrice}
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.workPrice}
            styles={fieldStyles}
            inputProps={{
              name: "workPrice",
              type: "number",
              min: 0,
              step: 1,
              inputMode: "decimal",
              placeholder: "0",
              value: form.workPrice,
              disabled: isPending,
              onChange: (e) => updateField("workPrice", e.target.value),
            }}
          />

          <JobFormField
            id={fieldId("materialPrice")}
            label={uk.job.materialPrice}
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.materialPrice}
            styles={fieldStyles}
            inputProps={{
              name: "materialPrice",
              type: "number",
              min: 0,
              step: 1,
              inputMode: "decimal",
              placeholder: uk.common.optional,
              value: form.materialPrice,
              disabled: isPending,
              onChange: (e) => updateField("materialPrice", e.target.value),
            }}
          />
        </div>

        {feedback ? (
          <p
            className={
              feedback.type === "success"
                ? styles.formSuccess
                : styles.formError
            }
            role={feedback.type === "success" ? "status" : "alert"}
            aria-live="polite"
          >
            {feedback.message}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button className={styles.submit} type="submit" disabled={isPending}>
            {isPending ? uk.common.saving : uk.job.saveCreate}
          </button>
        </div>
      </form>
    </section>
  );
}
