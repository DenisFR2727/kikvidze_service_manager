import type { JobStatus, JobsQuery } from "../../../lib/types.ts";

export type JobFiltersValue = {
  status: JobStatus | "";
  from: string;
  to: string;
  category: string;
};

export const EMPTY_JOB_FILTERS: Readonly<JobFiltersValue> = Object.freeze({
  status: "",
  from: "",
  to: "",
  category: "",
});

export function parseFilterStatus(raw: string): JobStatus | "" {
  switch (raw) {
    case "queued":
    case "in_progress":
    case "done":
    case "cancelled":
      return raw;
    default:
      return "";
  }
}

/**
 * Keep `from` ≤ `to` when both are set (YYYY-MM-DD string compare).
 * If `from` moves past `to`, bump `to` to `from`.
 */
export function withClampedDateRange(
  value: JobFiltersValue,
  partial: Partial<Pick<JobFiltersValue, "from" | "to">>,
): JobFiltersValue {
  const next: JobFiltersValue = { ...value, ...partial };
  if (next.from && next.to && next.from > next.to) {
    if (partial.from !== undefined) {
      next.to = next.from;
    } else {
      next.from = next.to;
    }
  }
  return next;
}

/** Convert panel state to API query (local day bounds for date inputs). */
export function jobFiltersToQuery(value: JobFiltersValue): JobsQuery {
  const query: JobsQuery = {};

  if (value.status) {
    query.status = value.status;
  }
  if (value.from) {
    query.from = new Date(`${value.from}T00:00:00`).toISOString();
  }
  if (value.to) {
    query.to = new Date(`${value.to}T23:59:59.999`).toISOString();
  }
  if (value.category.trim()) {
    query.category = value.category.trim();
  }

  return query;
}

export function hasActiveJobFilters(value: JobFiltersValue): boolean {
  return Boolean(
    value.status || value.from || value.to || value.category.trim(),
  );
}
