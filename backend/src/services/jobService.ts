import type { JobDocument, JobStatus } from "../models/Job.js";

type DisplayAtSource = Pick<JobDocument, "status" | "scheduledAt" | "completedAt">;

/**
 * Relevant datetime for list/calendar (FR-008):
 * done → completedAt when set; otherwise scheduledAt.
 */
export function getDisplayAt(job: DisplayAtSource): Date {
  if (job.status === "done" && job.completedAt) {
    return job.completedAt;
  }

  return job.scheduledAt;
}

/** Inclusive bounds on relevant date (`displayAt`). */
export function matchesDisplayAtRange(
  job: DisplayAtSource,
  from?: Date,
  to?: Date,
): boolean {
  if (!from && !to) {
    return true;
  }

  const at = getDisplayAt(job).getTime();
  if (from && at < from.getTime()) {
    return false;
  }
  if (to && at > to.getTime()) {
    return false;
  }
  return true;
}

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
