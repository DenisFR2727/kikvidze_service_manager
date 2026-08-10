import { toDatetimeLocalValue } from "./jobFormShared.ts";
import { validateJobCoreFields } from "./jobFormValidation.ts";
import { uk } from "../../lib/i18n/uk.ts";
import type { Job, JobStatus, UpdateJobInput } from "../../lib/types.ts";

export type DetailFieldKey =
  | "phone"
  | "name"
  | "car"
  | "category"
  | "scheduledAt"
  | "completedAt"
  | "workPrice"
  | "materialPrice"
  | "status";

export type DetailFieldErrors = Partial<Record<DetailFieldKey, string>>;

export type DetailFormState = {
  phone: string;
  name: string;
  car: string;
  category: string;
  scheduledAtLocal: string;
  completedAtLocal: string;
  workPrice: string;
  materialPrice: string;
  status: JobStatus;
};

/** Stable key so form resets only when job data actually changes. */
export function jobFormResetKey(job: Job): string {
  return [
    job.id,
    job.updatedAt ?? "",
    job.client.phone,
    job.client.name ?? "",
    job.car,
    job.category,
    job.scheduledAt,
    job.completedAt ?? "",
    String(job.workPrice),
    String(job.materialPrice),
    job.status,
  ].join("|");
}

export function jobToFormState(job: Job): DetailFormState {
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

export function validateDetailForm(
  form: DetailFormState,
): { payload?: UpdateJobInput; errors: DetailFieldErrors } {
  const { values, errors: coreErrors } = validateJobCoreFields(form, {
    scheduledRequiredMessage: uk.job.scheduledRequiredDetail,
  });

  const errors: DetailFieldErrors = { ...coreErrors };

  let completedAt: string | null = null;
  if (form.completedAtLocal) {
    const completedDate = new Date(form.completedAtLocal);
    if (Number.isNaN(completedDate.getTime())) {
      errors.completedAt = uk.job.completedInvalid;
    } else {
      completedAt = completedDate.toISOString();
    }
  }

  if (!values || Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors: {},
    payload: {
      phone: values.phone,
      name: values.nameTrimmed.length > 0 ? values.nameTrimmed : null,
      car: values.car,
      category: values.category,
      scheduledAt: values.scheduledAt,
      completedAt,
      workPrice: values.workPrice,
      materialPrice: values.materialPrice,
      status: form.status,
    },
  };
}
