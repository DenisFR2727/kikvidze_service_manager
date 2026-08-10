import { Router, type Request, type Response } from "express";
import { validateBody } from "../middleware/validate.js";
import { Client, type ClientDocument } from "../models/Client.js";
import { Job, type JobDocument } from "../models/Job.js";
import {
  createJobBodySchema,
  type CreateJobBody,
} from "../schemas/jobSchemas.js";
import { findOrCreateClient } from "../services/clientService.js";

type Timestamps = {
  createdAt?: Date;
  updatedAt?: Date;
};

/** Relevant datetime for list/calendar (FR-008). */
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

async function loadClientsById(
  clientIds: string[],
): Promise<Map<string, ClientDocument>> {
  if (clientIds.length === 0) {
    return new Map();
  }

  const clients = await Client.find().where("_id").in(clientIds).exec();
  return new Map(clients.map((client) => [String(client._id), client]));
}

async function listJobsHandler(_req: Request, res: Response): Promise<void> {
  const jobs = await Job.find().sort({ scheduledAt: -1 }).exec();
  const clientsById = await loadClientsById(
    [...new Set(jobs.map((job) => String(job.clientId)))],
  );

  const items = jobs.flatMap((job) => {
    const client = clientsById.get(String(job.clientId));
    return client ? [serializeJob(job, client)] : [];
  });

  res.status(200).json({ items });
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

  router.get("/", listJobsHandler);
  router.post("/", validateBody(createJobBodySchema), createJobHandler);

  return router;
}
