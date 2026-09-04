import type { ErrorRequestHandler, RequestHandler } from "express";

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};

type AppErrorOptions = {
  status?: number;
  fields?: Record<string, string>;
  cause?: unknown;
};

/** Application error mapped to the API error shape in contracts/api.md. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.status = options.status ?? STATUS_BY_CODE[code];
    this.fields = options.fields;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toApiErrorBody(error: AppError): ApiErrorBody {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
    },
  };

  if (error.fields && Object.keys(error.fields).length > 0) {
    body.error.fields = error.fields;
  }

  return body;
}

/** Fallback 404 for unmatched routes — mount after all `/api/*` routers. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError("NOT_FOUND", `Route ${req.method} ${req.path} not found`));
};

/**
 * Final Express error middleware (4-arg). Formats AppError and unknown errors
 * into `{ error: { code, message, fields? } }`.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isAppError(err)) {
    res.status(err.status).json(toApiErrorBody(err));
    return;
  }

  // express.json() / body-parser SyntaxError on malformed JSON
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as SyntaxError & { status?: number }).status === 400 &&
    "body" in err
  ) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body",
      },
    } satisfies ApiErrorBody);
    return;
  }

  console.error(err);

  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Internal server error",
    },
  } satisfies ApiErrorBody);
};
