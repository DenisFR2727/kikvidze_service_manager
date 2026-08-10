"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { JobFormField } from "@/components/jobs/JobFormField";
import {
  clearSuccessFeedback,
  parseNonNegativePrice,
  type FormFeedback,
} from "@/components/jobs/jobFormShared";
import { ApiError, apiClient } from "@/lib/api-client";
import { JOB_STATUS_LABELS, uk } from "@/lib/i18n/uk";
import type { CreateJobInput, Job, ListResponse } from "@/lib/types";
import styles from "./JobForm.module.scss";

type FieldKey =
  | "phone"
  | "name"
  | "car"
  | "category"
  | "scheduledAt"
  | "workPrice"
  | "materialPrice";

type FieldErrors = Partial<Record<FieldKey, string>>;

type CreateFormState = {
  phone: string;
  name: string;
  car: string;
  category: string;
  scheduledAtLocal: string;
  workPrice: string;
  materialPrice: string;
};

const EMPTY_FORM: CreateFormState = {
  phone: "",
  name: "",
  car: "",
  category: "",
  scheduledAtLocal: "",
  workPrice: "",
  materialPrice: "",
};

export type JobFormProps = {
  /** Called with normalized create payload; return created job for success details. */
  onSubmit: (values: CreateJobInput) => void | Promise<void | Job>;
  /** Optional known categories for suggestions (FR-015); otherwise loaded from API. */
  categories?: string[];
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

function fieldId(key: FieldKey): string {
  return `job-${key}`;
}

function validateCreateForm(
  form: CreateFormState,
): { payload?: CreateJobInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const nextPhone = form.phone.trim();
  const nextCar = form.car.trim();
  const nextCategory = form.category.trim();
  const trimmedName = form.name.trim();

  if (!nextPhone) {
    errors.phone = uk.job.phoneRequired;
  }
  if (!nextCar) {
    errors.car = uk.job.carRequired;
  }
  if (!nextCategory) {
    errors.category = uk.job.categoryRequired;
  }

  if (!form.scheduledAtLocal) {
    errors.scheduledAt = uk.job.scheduledRequired;
  } else {
    const scheduledDate = new Date(form.scheduledAtLocal);
    if (Number.isNaN(scheduledDate.getTime())) {
      errors.scheduledAt = uk.job.scheduledInvalid;
    }
  }

  const work = parseNonNegativePrice(form.workPrice, uk.job.workPriceLabel);
  if (!work.ok) {
    errors.workPrice = work.error;
  }

  const material = parseNonNegativePrice(
    form.materialPrice,
    uk.job.materialPriceLabel,
  );
  if (!material.ok) {
    errors.materialPrice = material.error;
  }

  if (Object.keys(errors).length > 0 || !work.ok || !material.ok) {
    return { errors };
  }

  return {
    errors,
    payload: {
      phone: nextPhone,
      name: trimmedName.length > 0 ? trimmedName : undefined,
      car: nextCar,
      category: nextCategory,
      scheduledAt: new Date(form.scheduledAtLocal).toISOString(),
      workPrice: work.value,
      materialPrice: material.value,
    },
  };
}

export function JobForm({ onSubmit, categories, onCreated }: JobFormProps) {
  const categoryListId = useId();
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [loadedCategories, setLoadedCategories] = useState<string[]>([]);

  const categoryOptions = categories ?? loadedCategories;

  useEffect(() => {
    if (categories !== undefined) {
      return;
    }

    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await apiClient.get<ListResponse<string>>(
          "/api/categories",
        );
        if (!cancelled) {
          setLoadedCategories(data.items);
        }
      } catch {
        // Suggestions are optional — form still works with free text.
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [categories]);

  function updateField<K extends keyof CreateFormState>(
    key: K,
    value: CreateFormState[K],
  ) {
    setFeedback(clearSuccessFeedback);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetFormAfterSuccess(keepPhone: boolean) {
    setForm((current) => ({
      ...EMPTY_FORM,
      phone: keepPhone ? current.phone : "",
    }));
    setFieldErrors({});
  }

  function buildSuccessMessage(job: Job): string {
    return uk.job.saveSuccessDetail(
      job.car,
      job.category,
      JOB_STATUS_LABELS[job.status],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { payload, errors } = validateCreateForm(form);
    setFieldErrors(errors);
    setFeedback(null);

    if (!payload) {
      return;
    }

    setIsPending(true);
    try {
      const result = await onSubmit(payload);
      resetFormAfterSuccess(true);

      if (result && typeof result === "object" && "id" in result) {
        setFeedback({
          type: "success",
          message: buildSuccessMessage(result),
        });
        onCreated?.(result);

        if (categories === undefined) {
          setLoadedCategories((current) => {
            if (current.includes(result.category)) {
              return current;
            }
            return [...current, result.category].sort((a, b) =>
              a.localeCompare(b, "uk"),
            );
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: uk.job.saveSuccess,
        });
      }
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors((current) => ({ ...current, ...err.fields }));
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : uk.job.createFailed;
      setFeedback({ type: "error", message });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="job-form-title">
      <h2 id="job-form-title" className={styles.title}>
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
              onChange: (e) => updateField("phone", e.target.value),
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
                {categoryOptions.map((option) => (
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
              onChange: (e) =>
                updateField("scheduledAtLocal", e.target.value),
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
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.materialPrice}
            styles={fieldStyles}
            inputProps={{
              name: "materialPrice",
              type: "number",
              min: 0,
              step: 1,
              inputMode: "decimal",
              placeholder: "0",
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
