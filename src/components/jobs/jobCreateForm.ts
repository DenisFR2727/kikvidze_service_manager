import type { CreateJobInput } from "../../lib/types.ts";
import { uk } from "../../lib/i18n/uk.ts";
import {
  validateJobCoreFields,
  type JobCoreFieldErrors,
  type JobCoreFieldKey,
  type JobCoreFormFields,
} from "./jobFormValidation.ts";

export type CreateFieldKey = JobCoreFieldKey;
export type CreateFieldErrors = JobCoreFieldErrors;
export type CreateFormState = JobCoreFormFields;

export function emptyCreateForm(): CreateFormState {
  return {
    phone: "",
    name: "",
    car: "",
    category: "",
    scheduledAtLocal: "",
    workPrice: "",
    materialPrice: "",
  };
}

export const EMPTY_CREATE_FORM: Readonly<CreateFormState> = Object.freeze(
  emptyCreateForm(),
);

export function validateCreateForm(
  form: CreateFormState,
): { payload?: CreateJobInput; errors: CreateFieldErrors } {
  const { values, errors } = validateJobCoreFields(form, {
    scheduledRequiredMessage: uk.job.scheduledRequired,
  });

  if (!values) {
    return { errors };
  }

  return {
    errors: {},
    payload: {
      phone: values.phone,
      name: values.nameTrimmed.length > 0 ? values.nameTrimmed : undefined,
      car: values.car,
      category: values.category,
      scheduledAt: values.scheduledAt,
      workPrice: values.workPrice,
      materialPrice: values.materialPrice,
    },
  };
}
