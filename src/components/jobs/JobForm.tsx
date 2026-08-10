"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { JOB_STATUS_LABELS, type CreateJobInput, type Job } from "@/lib/types";
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

type FormFeedback = {
  type: "success" | "error";
  message: string;
};

export type JobFormProps = {
  /** Called with normalized create payload; return created job for success details. */
  onSubmit: (values: CreateJobInput) => void | Promise<void | Job>;
};

function parseNonNegativePrice(
  raw: string,
  label: string,
): { value?: number; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: `Вкажіть ${label}` };
  }

  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { error: `${label} має бути числом` };
  }
  if (value < 0) {
    return { error: `${label} не може бути від’ємною` };
  }

  return { value };
}

export function JobForm({ onSubmit }: JobFormProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [car, setCar] = useState("");
  const [category, setCategory] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [workPrice, setWorkPrice] = useState("");
  const [materialPrice, setMaterialPrice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [isPending, setIsPending] = useState(false);

  function clearSuccessFeedback() {
    setFeedback((current) =>
      current?.type === "success" ? null : current,
    );
  }

  function updateField<T>(setter: (value: T) => void, value: T) {
    clearSuccessFeedback();
    setter(value);
  }

  function resetFormAfterSuccess() {
    setName("");
    setCar("");
    setCategory("");
    setScheduledAtLocal("");
    setWorkPrice("");
    setMaterialPrice("");
    setFieldErrors({});
  }

  function buildSuccessMessage(job: Job): string {
    const statusLabel = JOB_STATUS_LABELS[job.status];
    return `Запис збережено: ${job.car} — ${job.category} (${statusLabel})`;
  }

  function validate(): { payload?: CreateJobInput; errors: FieldErrors } {
    const errors: FieldErrors = {};
    const nextPhone = phone.trim();
    const nextCar = car.trim();
    const nextCategory = category.trim();
    const trimmedName = name.trim();

    if (!nextPhone) {
      errors.phone = "Вкажіть телефон клієнта";
    }

    if (!nextCar) {
      errors.car = "Вкажіть авто";
    }

    if (!nextCategory) {
      errors.category = "Вкажіть категорію робіт";
    }

    if (!scheduledAtLocal) {
      errors.scheduledAt = "Вкажіть дату та час";
    } else {
      const scheduledDate = new Date(scheduledAtLocal);
      if (Number.isNaN(scheduledDate.getTime())) {
        errors.scheduledAt = "Некоректна дата або час";
      }
    }

    const work = parseNonNegativePrice(workPrice, "ціну роботи");
    if (work.error) {
      errors.workPrice = work.error;
    }

    const material = parseNonNegativePrice(materialPrice, "ціну матеріалів");
    if (material.error) {
      errors.materialPrice = material.error;
    }

    if (Object.keys(errors).length > 0) {
      return { errors };
    }

    const scheduledDate = new Date(scheduledAtLocal);

    return {
      errors,
      payload: {
        phone: nextPhone,
        name: trimmedName.length > 0 ? trimmedName : undefined,
        car: nextCar,
        category: nextCategory,
        scheduledAt: scheduledDate.toISOString(),
        workPrice: work.value!,
        materialPrice: material.value!,
      },
    };
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const { payload, errors } = validate();
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
        message:
          result && typeof result === "object" && "id" in result
            ? buildSuccessMessage(result)
            : "Запис успішно збережено",
      });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors((current) => ({ ...current, ...err.fields }));
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : "Не вдалося зберегти запис. Спробуйте ще раз.";
      setFeedback({ type: "error", message });
    } finally {
      setIsPending(false);
    }
  }

  function fieldId(key: FieldKey): string {
    return `job-${key}`;
  }

  function renderFieldError(key: FieldKey) {
    const message = fieldErrors[key];
    if (!message) {
      return null;
    }

    return (
      <p
        id={`${fieldId(key)}-error`}
        className={styles.fieldError}
        role="alert"
      >
        {message}
      </p>
    );
  }

  return (
    <section className={styles.panel} aria-labelledby="job-form-title">
      <h2 id="job-form-title" className={styles.title}>
        Новий запис
      </h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("phone")}>
              Телефон <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("phone")}
              className={styles.input}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+380671112233"
              value={phone}
              onChange={(e) => updateField(setPhone, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={
                fieldErrors.phone ? `${fieldId("phone")}-error` : undefined
              }
            />
            {renderFieldError("phone")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("name")}>
              Ім&apos;я клієнта
            </label>
            <input
              id={fieldId("name")}
              className={styles.input}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Опційно"
              value={name}
              onChange={(e) => updateField(setName, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={
                fieldErrors.name ? `${fieldId("name")}-error` : undefined
              }
            />
            {renderFieldError("name")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("car")}>
              Авто <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("car")}
              className={styles.input}
              name="car"
              type="text"
              placeholder="BMW X5"
              value={car}
              onChange={(e) => updateField(setCar, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.car)}
              aria-describedby={
                fieldErrors.car ? `${fieldId("car")}-error` : undefined
              }
            />
            {renderFieldError("car")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("category")}>
              Категорія робіт <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("category")}
              className={styles.input}
              name="category"
              type="text"
              placeholder="Пошив сидінь"
              value={category}
              onChange={(e) => updateField(setCategory, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={
                fieldErrors.category
                  ? `${fieldId("category")}-error`
                  : undefined
              }
            />
            {renderFieldError("category")}
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor={fieldId("scheduledAt")}>
              Дата та час <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("scheduledAt")}
              className={styles.input}
              name="scheduledAt"
              type="datetime-local"
              value={scheduledAtLocal}
              onChange={(e) => updateField(setScheduledAtLocal, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.scheduledAt)}
              aria-describedby={
                fieldErrors.scheduledAt
                  ? `${fieldId("scheduledAt")}-error`
                  : undefined
              }
            />
            {renderFieldError("scheduledAt")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("workPrice")}>
              Ціна роботи, ₴ <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("workPrice")}
              className={styles.input}
              name="workPrice"
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              placeholder="0"
              value={workPrice}
              onChange={(e) => updateField(setWorkPrice, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.workPrice)}
              aria-describedby={
                fieldErrors.workPrice
                  ? `${fieldId("workPrice")}-error`
                  : undefined
              }
            />
            {renderFieldError("workPrice")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("materialPrice")}>
              Ціна матеріалів, ₴ <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("materialPrice")}
              className={styles.input}
              name="materialPrice"
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              placeholder="0"
              value={materialPrice}
              onChange={(e) => updateField(setMaterialPrice, e.target.value)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.materialPrice)}
              aria-describedby={
                fieldErrors.materialPrice
                  ? `${fieldId("materialPrice")}-error`
                  : undefined
              }
            />
            {renderFieldError("materialPrice")}
          </div>
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
            {isPending ? "Збереження…" : "Зберегти запис"}
          </button>
        </div>
      </form>
    </section>
  );
}
