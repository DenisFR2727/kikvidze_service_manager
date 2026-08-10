import { uk } from "../../lib/i18n/uk.ts";

export type FormFeedback = {
  type: "success" | "error";
  message: string;
};

export type PriceParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseNonNegativePrice(
  raw: string,
  label: string,
): PriceParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: uk.job.priceRequired(label) };
  }

  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value)) {
    return { ok: false, error: uk.job.priceNotNumber(label) };
  }
  if (value < 0) {
    return { ok: false, error: uk.job.priceNegative(label) };
  }

  return { ok: true, value };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** ISO → value for `<input type="datetime-local">` in local timezone. */
export function toDatetimeLocalValue(
  iso: string | null | undefined,
): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Mark home list/calendar to refetch after navigate-back (T047). */
export function markJobsListStale(): void {
  try {
    sessionStorage.setItem("jobs-list-stale", "1");
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function clearSuccessFeedback(
  current: FormFeedback | null,
): FormFeedback | null {
  return current?.type === "success" ? null : current;
}
