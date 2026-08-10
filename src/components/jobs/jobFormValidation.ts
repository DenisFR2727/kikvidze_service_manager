import { parseNonNegativePrice } from "./jobFormShared.ts";
import { uk } from "../../lib/i18n/uk.ts";

export type JobCoreFormFields = {
  phone: string;
  name: string;
  car: string;
  category: string;
  scheduledAtLocal: string;
  workPrice: string;
  materialPrice: string;
};

export type JobCoreFieldKey =
  | "phone"
  | "name"
  | "car"
  | "category"
  | "scheduledAt"
  | "workPrice"
  | "materialPrice";

export type JobCoreFieldErrors = Partial<Record<JobCoreFieldKey, string>>;

export type JobCoreValidated = {
  phone: string;
  nameTrimmed: string;
  car: string;
  category: string;
  scheduledAt: string;
  workPrice: number;
  materialPrice: number;
};

/** Shared phone/car/category/schedule/price rules for create + detail forms. */
export function validateJobCoreFields(
  form: JobCoreFormFields,
  options: { scheduledRequiredMessage: string },
): { values?: JobCoreValidated; errors: JobCoreFieldErrors } {
  const errors: JobCoreFieldErrors = {};
  const phone = form.phone.trim();
  const car = form.car.trim();
  const category = form.category.trim();
  const nameTrimmed = form.name.trim();

  if (!phone) {
    errors.phone = uk.job.phoneRequired;
  }
  if (!car) {
    errors.car = uk.job.carRequired;
  }
  if (!category) {
    errors.category = uk.job.categoryRequired;
  }

  let scheduledAt: string | undefined;
  if (!form.scheduledAtLocal) {
    errors.scheduledAt = options.scheduledRequiredMessage;
  } else {
    const scheduledDate = new Date(form.scheduledAtLocal);
    if (Number.isNaN(scheduledDate.getTime())) {
      errors.scheduledAt = uk.job.scheduledInvalid;
    } else {
      scheduledAt = scheduledDate.toISOString();
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

  if (
    Object.keys(errors).length > 0 ||
    !work.ok ||
    !material.ok ||
    scheduledAt === undefined
  ) {
    return { errors };
  }

  return {
    errors: {},
    values: {
      phone,
      nameTrimmed,
      car,
      category,
      scheduledAt,
      workPrice: work.value,
      materialPrice: material.value,
    },
  };
}
