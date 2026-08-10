import { z } from "zod";
import { JOB_STATUSES } from "../models/Job.js";
import { isValidPhoneInput } from "../utils/phone.js";

export const createJobBodySchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Required")
    .refine(isValidPhoneInput, "Invalid phone number"),
  name: z.string().trim().optional().nullable(),
  car: z.string().trim().min(1, "Required"),
  category: z.string().trim().min(1, "Required"),
  scheduledAt: z.coerce.date({
    error: "Invalid datetime",
  }),
  workPrice: z.number().min(0, "must be ≥ 0"),
  materialPrice: z.number().min(0, "must be ≥ 0"),
});

export type CreateJobBody = z.infer<typeof createJobBodySchema>;

export const jobIdParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid job id"),
});

export type JobIdParams = z.infer<typeof jobIdParamsSchema>;

/** Partial update body for `PATCH /api/jobs/:id` (shared entry for status + fields). */
export const updateJobBodySchema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(1, "Required")
      .refine(isValidPhoneInput, "Invalid phone number")
      .optional(),
    name: z.string().trim().optional().nullable(),
    car: z.string().trim().min(1, "Required").optional(),
    category: z.string().trim().min(1, "Required").optional(),
    scheduledAt: z
      .coerce.date({
        error: "Invalid datetime",
      })
      .optional(),
    completedAt: z.coerce
      .date({
        error: "Invalid datetime",
      })
      .nullable()
      .optional(),
    workPrice: z.number().min(0, "must be ≥ 0").optional(),
    materialPrice: z.number().min(0, "must be ≥ 0").optional(),
    status: z.enum(JOB_STATUSES).optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    { message: "At least one field is required" },
  );

export type UpdateJobBody = z.infer<typeof updateJobBodySchema>;

/** Empty query strings → omitted (Express always yields strings). */
function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return value;
}

/**
 * Query for `GET /api/jobs`.
 * `from` / `to` bound the relevant date (`displayAt`); both inclusive.
 * `q` = partial match on phone / client name / car.
 */
export const listJobsQuerySchema = z
  .object({
    status: z.preprocess(emptyToUndefined, z.enum(JOB_STATUSES).optional()),
    from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    category: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).optional(),
    ),
    q: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    clientId: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .regex(/^[a-fA-F0-9]{24}$/, "Invalid client id")
        .optional(),
    ),
  })
  .refine(
    (query) =>
      query.from === undefined ||
      query.to === undefined ||
      query.from.getTime() <= query.to.getTime(),
    { message: "`from` must be ≤ `to`", path: ["from"] },
  );

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
