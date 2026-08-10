import { z } from "zod";
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
