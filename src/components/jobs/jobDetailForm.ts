import { parseNonNegativePrice, toDatetimeLocalValue } from "./jobFormShared.ts";
import { uk } from "../../lib/i18n/uk.ts";
import type { Job, JobStatus, UpdateJobInput } from "../../lib/types";

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
  const errors: DetailFieldErrors = {};
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
    errors.scheduledAt = uk.job.scheduledRequiredDetail;
  } else {
    const scheduledDate = new Date(form.scheduledAtLocal);
    if (Number.isNaN(scheduledDate.getTime())) {
      errors.scheduledAt = uk.job.scheduledInvalid;
    }
  }

  let completedAt: string | null = null;
  if (form.completedAtLocal) {
    const completedDate = new Date(form.completedAtLocal);
    if (Number.isNaN(completedDate.getTime())) {
      errors.completedAt = uk.job.completedInvalid;
    } else {
      completedAt = completedDate.toISOString();
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
      name: trimmedName.length > 0 ? trimmedName : null,
      car: nextCar,
      category: nextCategory,
      scheduledAt: new Date(form.scheduledAtLocal).toISOString(),
      completedAt,
      workPrice: work.value,
      materialPrice: material.value,
      status: form.status,
    },
  };
}
