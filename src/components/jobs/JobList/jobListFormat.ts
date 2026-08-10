import type { Job } from "../../../lib/types.ts";

export function formatDisplayAt(iso: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatClient(job: Job): string {
  const { phone, name } = job.client;
  return name?.trim() ? `${phone} · ${name.trim()}` : phone;
}
