import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { AppError } from "./errorHandler.js";

type RequestTarget = "body" | "query" | "params";

/** Map Zod issues to `{ field: firstMessage }` for the API error `fields` object. */
export function zodErrorToFields(error: z.ZodError): Record<string, string> {
  const { fieldErrors } = z.flattenError(error);
  const fields: Record<string, string> = {};

  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0 && messages[0]) {
      fields[key] = messages[0];
    }
  }

  return fields;
}

function validationMessage(error: z.ZodError, fields: Record<string, string>): string {
  if (Object.keys(fields).length > 0) {
    return "Validation failed";
  }

  const { formErrors } = z.flattenError(error);
  return formErrors[0] ?? "Validation failed";
}

/**
 * Validate `req[target]` with a Zod schema; replace with parsed data on success.
 * On failure, forwards `AppError(VALIDATION_ERROR)` to the error handler.
 */
export function validate(
  schema: ZodType,
  target: RequestTarget = "body",
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fields = zodErrorToFields(result.error);
      next(
        new AppError("VALIDATION_ERROR", validationMessage(result.error, fields), {
          fields,
        }),
      );
      return;
    }

    // Parsed/coerced values replace the raw target (query/params may change types).
    (req as Record<RequestTarget, unknown>)[target] = result.data;
    next();
  };
}

export function validateBody(schema: ZodType): RequestHandler {
  return validate(schema, "body");
}

export function validateQuery(schema: ZodType): RequestHandler {
  return validate(schema, "query");
}

export function validateParams(schema: ZodType): RequestHandler {
  return validate(schema, "params");
}
