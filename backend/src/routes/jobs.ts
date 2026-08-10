import { Router, type Request, type Response } from "express";
import { validateBody } from "../middleware/validate.js";
import { Job, type JobDocument } from "../models/Job.js";
import type { ClientDocument } from "../models/Client.js";
import {
  createJobBodySchema,
  type CreateJobBody,
} from "../schemas/jobSchemas.js";
import { findOrCreateClient } from "../services/clientService.js";

type Timestamps = {
  createdAt?: Date;
  updatedAt?: Date;
};

function getDisplayAt(job: JobDocument): Date {
  if (job.status === "done" && job.completedAt) {
    return job.completedAt;
  }

  return job.scheduledAt;
}

function serializeClient(client: ClientDocument) {
  return {
    id: String(client._id),
    phone: client.phone,
    name: client.name ?? null,
  };
}

function serializeJob(job: JobDocument, client: ClientDocument) {
  const timestamps = job as JobDocument & Timestamps;

  return {
    id: String(job._id),
    client: serializeClient(client),
    car: job.car,
    category: job.category,
    scheduledAt: job.scheduledAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    workPrice: job.workPrice,
    materialPrice: job.materialPrice,
    status: job.status,
    displayAt: getDisplayAt(job).toISOString(),
    ...(timestamps.createdAt
      ? { createdAt: timestamps.createdAt.toISOString() }
      : {}),
    ...(timestamps.updatedAt
      ? { updatedAt: timestamps.updatedAt.toISOString() }
      : {}),
  };
}

async function createJobHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateJobBody;

  const { client } = await findOrCreateClient({
    phone: body.phone,
    name: body.name,
  });

  const job = await Job.create({
    clientId: String(client._id),
    car: body.car,
    category: body.category,
    scheduledAt: body.scheduledAt,
    workPrice: body.workPrice,
    materialPrice: body.materialPrice,
    status: "queued",
  });

  res.status(201).json(serializeJob(job, client));
}

export function createJobsRouter(): Router {
  const router = Router();

  router.post("/", validateBody(createJobBodySchema), createJobHandler);

  return router;
}
