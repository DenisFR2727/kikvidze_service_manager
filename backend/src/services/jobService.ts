import type { JobDocument, JobStatus } from "../models/Job.js";

/**
 * Apply a status change on a job document (in memory).
 * Entering `done` sets `completedAt` to `now` when it is still empty (FR-006).
 * Leaving `done` keeps `completedAt` unless the caller clears/overrides it.
 */
export function applyStatusTransition(
  job: JobDocument,
  nextStatus: JobStatus,
  now: Date = new Date(),
): void {
  job.status = nextStatus;

  if (nextStatus === "done" && job.completedAt == null) {
    job.completedAt = now;
  }
}
