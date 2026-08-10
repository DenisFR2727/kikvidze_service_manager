import { z } from "zod";

/** Empty query strings → omitted (Express always yields strings). */
function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return value;
}

export const listClientsQuerySchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;

export const clientIdParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid client id"),
});

export type ClientIdParams = z.infer<typeof clientIdParamsSchema>;
