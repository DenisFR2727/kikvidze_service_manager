import type { JobStatus } from "../../../lib/types.ts";

export function parseJobStatus(raw: string): JobStatus | null {
  switch (raw) {
    case "queued":
    case "in_progress":
    case "done":
    case "cancelled":
      return raw;
    default:
      return null;
  }
}
