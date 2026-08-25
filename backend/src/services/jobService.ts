import type { Types } from "mongoose";
import { AppError } from "../middleware/errorHandler.js";
import type { ClientDocument } from "../models/Client.js";
import { Job, type JobDocument, type JobStatus } from "../models/Job.js";
import { findOrCreateClient } from "./clientService.js";

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

export type UpdateJobInput = {
  phone?: string;
  name?: string | null;
  car?: string;
  category?: string;
  scheduledAt?: Date;
  completedAt?: Date | null;
  workPrice?: number;
  materialPrice?: number;
  status?: JobStatus;
};

function applyOptionalName(
  client: ClientDocument,
  name: string | null | undefined,
) {
  const trimmed = name?.trim() ?? "";
  if (trimmed) {
    client.name = trimmed;
  } else {
    client.name = undefined;
  }
}

/**
 * Load a job by id only if it belongs to `adminId`.
 * Missing or foreign ownership → `404 NOT_FOUND` (no existence leak).
 */
export async function requireJobOwnedByAdmin(
  id: string,
  adminId: Types.ObjectId | string,
): Promise<JobDocument> {
  const job = await Job.findOne({ _id: id, adminId }).exec();
  if (!job) {
    throw new AppError("NOT_FOUND", "Job not found");
  }
  return job;
}

/**
 * Apply PATCH fields: phone change rebinds via find-or-create (FR-014)
 * within the job owner's admin scope. Mutates `job` in memory; saves client
 * when name/phone binding changes. Caller must `job.save()`.
 */
export async function applyJobPatch(
  job: JobDocument,
  client: ClientDocument,
  body: UpdateJobInput,
): Promise<ClientDocument> {
  if (String(client.adminId) !== String(job.adminId)) {
    throw new AppError("NOT_FOUND", "Client not found");
  }

  let nextClient = client;

  if (body.phone !== undefined) {
    const result = await findOrCreateClient({
      adminId: job.adminId,
      phone: body.phone,
      name: body.name,
    });
    nextClient = result.client;
    job.clientId = nextClient._id;

    // Name on rebind: apply when provided (including clear).
    if (body.name !== undefined) {
      applyOptionalName(nextClient, body.name);
      await nextClient.save();
    }
  } else if (body.name !== undefined) {
    applyOptionalName(nextClient, body.name);
    await nextClient.save();
  }

  if (body.car !== undefined) {
    job.car = body.car;
  }
  if (body.category !== undefined) {
    job.category = body.category;
  }
  if (body.scheduledAt !== undefined) {
    job.scheduledAt = body.scheduledAt;
  }
  if (body.workPrice !== undefined) {
    job.workPrice = body.workPrice;
  }
  if (body.materialPrice !== undefined) {
    job.materialPrice = body.materialPrice;
  }

  // Explicit completedAt before status so transition can still fill if null + done
  if (body.completedAt !== undefined) {
    job.completedAt = body.completedAt ?? undefined;
  }

  if (body.status !== undefined) {
    applyStatusTransition(job, body.status);
  }

  return nextClient;
}

/**
 * Hard-delete a job owned by `adminId`. Client is retained (FR-028 / contract).
 * Missing or foreign ownership → `404 NOT_FOUND`.
 */
export async function deleteJobById(
  id: string,
  adminId: Types.ObjectId | string,
): Promise<void> {
  const result = await Job.findOneAndDelete({ _id: id, adminId }).exec();
  if (!result) {
    throw new AppError("NOT_FOUND", "Job not found");
  }
}
