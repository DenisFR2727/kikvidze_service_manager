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
 * Express 5 exposes `req.query` / `req.params` as getter-only; assign via
 * `defineProperty` so Zod-coerced values (e.g. dates) are readable by handlers.
 */
function replaceRequestTarget(
  req: Parameters<RequestHandler>[0],
  target: RequestTarget,
  value: unknown,
): void {
  if (target === "body") {
    req.body = value;
    return;
  }

  Object.defineProperty(req, target, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
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

    replaceRequestTarget(req, target, result.data);
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
