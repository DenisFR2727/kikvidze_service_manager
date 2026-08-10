"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { JobStatusSelect } from "@/components/jobs/JobStatusSelect";
import { ApiError, apiClient } from "@/lib/api-client";
import type {
  Job,
  JobStatus,
  ListResponse,
  UpdateJobInput,
} from "@/lib/types";
import styles from "./JobDetailCard.module.scss";

type FieldKey =
  | "phone"
  | "name"
  | "car"
  | "category"
  | "scheduledAt"
  | "completedAt"
  | "workPrice"
  | "materialPrice"
  | "status";

type FieldErrors = Partial<Record<FieldKey, string>>;

type FormFeedback = {
  type: "success" | "error";
  message: string;
};

export type JobDetailCardProps = {
  job: Job;
  onSaved: (job: Job) => void;
  onDeleted: () => void;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** ISO → value for `<input type="datetime-local">` in local timezone. */
function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

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

function jobToFormState(job: Job) {
  return {
    phone: job.client.phone,
    name: job.client.name ?? "",
    car: job.car,
    category: job.category,
    scheduledAtLocal: toDatetimeLocalValue(job.scheduledAt),
    completedAtLocal: toDatetimeLocalValue(job.completedAt),
    workPrice: String(job.workPrice),
    materialPrice: String(job.materialPrice),
    status: job.status,
  };
}

export function JobDetailCard({ job, onSaved, onDeleted }: JobDetailCardProps) {
  const categoryListId = useId();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const initial = jobToFormState(job);

  const [phone, setPhone] = useState(initial.phone);
  const [name, setName] = useState(initial.name);
  const [car, setCar] = useState(initial.car);
  const [category, setCategory] = useState(initial.category);
  const [scheduledAtLocal, setScheduledAtLocal] = useState(
    initial.scheduledAtLocal,
  );
  const [completedAtLocal, setCompletedAtLocal] = useState(
    initial.completedAtLocal,
  );
  const [workPrice, setWorkPrice] = useState(initial.workPrice);
  const [materialPrice, setMaterialPrice] = useState(initial.materialPrice);
  const [status, setStatus] = useState<JobStatus>(initial.status);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const next = jobToFormState(job);
    setPhone(next.phone);
    setName(next.name);
    setCar(next.car);
    setCategory(next.category);
    setScheduledAtLocal(next.scheduledAtLocal);
    setCompletedAtLocal(next.completedAtLocal);
    setWorkPrice(next.workPrice);
    setMaterialPrice(next.materialPrice);
    setStatus(next.status);
    setFieldErrors({});
    setFeedback(null);
  }, [job]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data =
          await apiClient.get<ListResponse<string>>("/api/categories");
        if (!cancelled) {
          setCategories(data.items);
        }
      } catch {
        // Suggestions optional.
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function clearSuccessFeedback() {
    setFeedback((current) =>
      current?.type === "success" ? null : current,
    );
  }

  function updateField<T>(setter: (value: T) => void, value: T) {
    clearSuccessFeedback();
    setter(value);
  }

  function fieldId(key: FieldKey): string {
    return `job-detail-${key}`;
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

  function validate(): { payload?: UpdateJobInput; errors: FieldErrors } {
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
      errors.scheduledAt = "Вкажіть заплановану дату та час";
    } else {
      const scheduledDate = new Date(scheduledAtLocal);
      if (Number.isNaN(scheduledDate.getTime())) {
        errors.scheduledAt = "Некоректна дата або час";
      }
    }

    let completedAt: string | null = null;
    if (completedAtLocal) {
      const completedDate = new Date(completedAtLocal);
      if (Number.isNaN(completedDate.getTime())) {
        errors.completedAt = "Некоректна дата або час виконання";
      } else {
        completedAt = completedDate.toISOString();
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

    return {
      errors,
      payload: {
        phone: nextPhone,
        name: trimmedName.length > 0 ? trimmedName : null,
        car: nextCar,
        category: nextCategory,
        scheduledAt: new Date(scheduledAtLocal).toISOString(),
        completedAt,
        workPrice: work.value!,
        materialPrice: material.value!,
        status,
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

    setIsSaving(true);
    try {
      const updated = await apiClient.patch<Job>(
        `/api/jobs/${job.id}`,
        payload,
      );
      onSaved(updated);
      setFeedback({
        type: "success",
        message: "Зміни збережено",
      });
      // Ensure home list/calendar refetch after navigating back (T047).
      try {
        sessionStorage.setItem("jobs-list-stale", "1");
      } catch {
        // Ignore quota / private mode failures.
      }
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors((current) => ({ ...current, ...err.fields }));
      }
      setFeedback({
        type: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Не вдалося зберегти зміни",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteDialog() {
    setFeedback(null);
    deleteDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }
    deleteDialogRef.current?.close();
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/jobs/${job.id}`);
      try {
        sessionStorage.setItem("jobs-list-stale", "1");
      } catch {
        // Ignore quota / private mode failures.
      }
      deleteDialogRef.current?.close();
      onDeleted();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Не вдалося видалити роботу",
      });
      deleteDialogRef.current?.close();
    } finally {
      setIsDeleting(false);
    }
  }

  const busy = isSaving || isDeleting;

  return (
    <section className={styles.panel} aria-labelledby="job-detail-title">
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/">← До списку</Link>
          </p>
          <h1 id="job-detail-title" className={styles.title}>
            Картка роботи
          </h1>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("phone")}>
              Телефон <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("phone")}
              className={styles.input}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              disabled={busy}
              onChange={(e) => updateField(setPhone, e.target.value)}
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
              type="text"
              autoComplete="name"
              value={name}
              disabled={busy}
              onChange={(e) => updateField(setName, e.target.value)}
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
              type="text"
              value={car}
              disabled={busy}
              onChange={(e) => updateField(setCar, e.target.value)}
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
              type="text"
              list={categoryListId}
              value={category}
              disabled={busy}
              onChange={(e) => updateField(setCategory, e.target.value)}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={
                fieldErrors.category
                  ? `${fieldId("category")}-error`
                  : undefined
              }
            />
            <datalist id={categoryListId}>
              {categories.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            {renderFieldError("category")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("scheduledAt")}>
              Заплановано <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("scheduledAt")}
              className={styles.input}
              type="datetime-local"
              value={scheduledAtLocal}
              disabled={busy}
              onChange={(e) =>
                updateField(setScheduledAtLocal, e.target.value)
              }
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
            <label className={styles.label} htmlFor={fieldId("completedAt")}>
              Виконано
            </label>
            <input
              id={fieldId("completedAt")}
              className={styles.input}
              type="datetime-local"
              value={completedAtLocal}
              disabled={busy}
              onChange={(e) =>
                updateField(setCompletedAtLocal, e.target.value)
              }
              aria-invalid={Boolean(fieldErrors.completedAt)}
              aria-describedby={
                fieldErrors.completedAt
                  ? `${fieldId("completedAt")}-error`
                  : undefined
              }
            />
            {renderFieldError("completedAt")}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId("workPrice")}>
              Ціна роботи, ₴ <span className={styles.required}>*</span>
            </label>
            <input
              id={fieldId("workPrice")}
              className={styles.input}
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={workPrice}
              disabled={busy}
              onChange={(e) => updateField(setWorkPrice, e.target.value)}
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
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={materialPrice}
              disabled={busy}
              onChange={(e) => updateField(setMaterialPrice, e.target.value)}
              aria-invalid={Boolean(fieldErrors.materialPrice)}
              aria-describedby={
                fieldErrors.materialPrice
                  ? `${fieldId("materialPrice")}-error`
                  : undefined
              }
            />
            {renderFieldError("materialPrice")}
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor={fieldId("status")}>
              Статус
            </label>
            <JobStatusSelect
              id={fieldId("status")}
              value={status}
              disabled={busy}
              onChange={(next) => updateField(setStatus, next)}
            />
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
          <button className={styles.save} type="submit" disabled={busy}>
            {isSaving ? "Збереження…" : "Зберегти зміни"}
          </button>
          <button
            className={styles.delete}
            type="button"
            disabled={busy}
            onClick={openDeleteDialog}
          >
            Видалити
          </button>
        </div>
      </form>

      <dialog
        ref={deleteDialogRef}
        className={styles.dialog}
        aria-labelledby="job-delete-title"
        onCancel={(event) => {
          if (isDeleting) {
            event.preventDefault();
          }
        }}
      >
        <div className={styles.dialogBody}>
          <h2 id="job-delete-title" className={styles.dialogTitle}>
            Видалити роботу?
          </h2>
          <p className={styles.dialogText}>
            Запис буде видалено остаточно. Клієнт залишиться в системі.
          </p>
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.dialogCancel}
              disabled={isDeleting}
              onClick={closeDeleteDialog}
            >
              Скасувати
            </button>
            <button
              type="button"
              className={styles.dialogConfirm}
              disabled={isDeleting}
              onClick={() => {
                void confirmDelete();
              }}
            >
              {isDeleting ? "Видалення…" : "Так, видалити"}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
