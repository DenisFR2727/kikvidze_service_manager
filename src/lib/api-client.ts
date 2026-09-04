/**
 * Typed fetch client for the Express API.
 * Always sends cookies (`credentials: "include"`) for session auth.
 */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "NETWORK"
  | "UNKNOWN";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

const KNOWN_ERROR_CODES = new Set<ApiErrorCode>([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
]);

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Copy .env.local.example to .env.local.",
    );
  }
  return base.replace(/\/$/, "");
}

function resolveUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getApiBaseUrl()}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") {
    return false;
  }
  const error = (value as ApiErrorBody).error;
  return (
    !!error &&
    typeof error === "object" &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

function normalizeErrorCode(code: string): ApiErrorCode {
  return KNOWN_ERROR_CODES.has(code as ApiErrorCode)
    ? (code as ApiErrorCode)
    : "UNKNOWN";
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED";
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body" | "credentials"> & {
  /** JSON-serializable body (sent as `application/json`). */
  body?: unknown;
  /** Query string params; `null`/`undefined`/empty values are omitted. */
  query?: Record<string, string | number | boolean | null | undefined>;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Low-level request helper. Throws {@link ApiError} on non-2xx responses.
 * For `204 No Content`, resolves to `undefined` (cast as `T`).
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, query, headers: initHeaders, ...init } = options;

  const headers = new Headers(initHeaders);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path, query), {
      ...init,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError(
      0,
      "NETWORK",
      cause instanceof Error ? cause.message : "Network request failed",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError(
        response.status,
        normalizeErrorCode(payload.error.code),
        payload.error.message,
        payload.error.fields,
      );
    }

    throw new ApiError(
      response.status,
      response.status === 401 ? "UNAUTHORIZED" : "UNKNOWN",
      response.statusText || `Request failed with status ${response.status}`,
    );
  }

  return payload as T;
}

export const apiClient = {
  get<T>(path: string, options?: Omit<ApiRequestOptions, "body" | "method">) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T = void>(
    path: string,
    options?: Omit<ApiRequestOptions, "body" | "method">,
  ) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};
