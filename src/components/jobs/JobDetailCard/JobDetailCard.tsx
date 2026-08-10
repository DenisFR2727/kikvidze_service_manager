"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { JobFormField } from "@/components/jobs/JobFormField";
import {
  jobFormResetKey,
  jobToFormState,
  validateDetailForm,
  type DetailFieldErrors,
  type DetailFormState,
} from "@/components/jobs/jobDetailForm";
import {
  clearSuccessFeedback,
  markJobsListStale,
  type FormFeedback,
} from "@/components/jobs/jobFormShared";
import { JobStatusSelect } from "@/components/jobs/JobStatusSelect";
import { ApiError, apiClient } from "@/lib/api-client";
import { uk } from "@/lib/i18n/uk";
import type { Job, JobStatus, ListResponse } from "@/lib/types";
import styles from "./JobDetailCard.module.scss";

export type JobDetailCardProps = {
  job: Job;
  onSaved: (job: Job) => void;
  onDeleted: () => void;
};

const fieldStyles = {
  field: styles.field,
  fieldFull: styles.fieldFull,
  label: styles.label,
  required: styles.required,
  input: styles.input,
  fieldError: styles.fieldError,
};

function fieldId(key: keyof DetailFormState | "status"): string {
  return `job-detail-${key}`;
}

export function JobDetailCard({ job, onSaved, onDeleted }: JobDetailCardProps) {
  const categoryListId = useId();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const resetKey = jobFormResetKey(job);
  const [form, setForm] = useState<DetailFormState>(() => jobToFormState(job));
  const [syncedResetKey, setSyncedResetKey] = useState(resetKey);
  const [fieldErrors, setFieldErrors] = useState<DetailFieldErrors>({});
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  if (resetKey !== syncedResetKey) {
    setSyncedResetKey(resetKey);
    setForm(jobToFormState(job));
    setFieldErrors({});
    setFeedback(null);
  }

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

  function updateField<K extends keyof DetailFormState>(
    key: K,
    value: DetailFormState[K],
  ) {
    setFeedback(clearSuccessFeedback);
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { payload, errors } = validateDetailForm(form);
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
        message: uk.job.editSuccess,
      });
      markJobsListStale();
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors((current) => ({ ...current, ...err.fields }));
      }
      setFeedback({
        type: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : uk.job.updateFailed,
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
      markJobsListStale();
      deleteDialogRef.current?.close();
      onDeleted();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error && err.message
            ? err.message
            : uk.job.deleteFailed,
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
        <p className={styles.breadcrumb}>
          <Link href="/">{uk.common.backToList}</Link>
        </p>
        <h1 id="job-detail-title" className={styles.title}>
          {uk.job.detailTitle}
        </h1>
      </div>

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
              type: "tel",
              autoComplete: "tel",
              inputMode: "tel",
              value: form.phone,
              disabled: busy,
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
              type: "text",
              autoComplete: "name",
              value: form.name,
              disabled: busy,
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
              type: "text",
              value: form.car,
              disabled: busy,
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
              type: "text",
              list: categoryListId,
              value: form.category,
              disabled: busy,
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
            id={fieldId("scheduledAtLocal")}
            label={uk.job.scheduledAtDetail}
            required
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.scheduledAt}
            styles={fieldStyles}
            inputProps={{
              type: "datetime-local",
              value: form.scheduledAtLocal,
              disabled: busy,
              onChange: (e) => updateField("scheduledAtLocal", e.target.value),
            }}
          />

          <JobFormField
            id={fieldId("completedAtLocal")}
            label={uk.job.completedAt}
            requiredMark={uk.common.requiredMark}
            error={fieldErrors.completedAt}
            styles={fieldStyles}
            inputProps={{
              type: "datetime-local",
              value: form.completedAtLocal,
              disabled: busy,
              onChange: (e) => updateField("completedAtLocal", e.target.value),
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
              type: "number",
              min: 0,
              step: 1,
              inputMode: "decimal",
              value: form.workPrice,
              disabled: busy,
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
              type: "number",
              min: 0,
              step: 1,
              inputMode: "decimal",
              value: form.materialPrice,
              disabled: busy,
              onChange: (e) => updateField("materialPrice", e.target.value),
            }}
          />

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor={fieldId("status")}>
              {uk.job.status}
            </label>
            <JobStatusSelect
              id={fieldId("status")}
              value={form.status}
              disabled={busy}
              onChange={(next: JobStatus) => updateField("status", next)}
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
            {isSaving ? uk.common.saving : uk.job.saveEdit}
          </button>
          <button
            className={styles.delete}
            type="button"
            disabled={busy}
            onClick={openDeleteDialog}
          >
            {uk.common.delete}
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
            {uk.job.deleteConfirmTitle}
          </h2>
          <p className={styles.dialogText}>{uk.job.deleteConfirmText}</p>
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.dialogCancel}
              disabled={isDeleting}
              onClick={closeDeleteDialog}
            >
              {uk.common.cancel}
            </button>
            <button
              type="button"
              className={styles.dialogConfirm}
              disabled={isDeleting}
              onClick={() => {
                void confirmDelete();
              }}
            >
              {isDeleting ? uk.common.deleting : uk.job.deleteConfirm}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
