import { Router, type Request, type Response } from "express";
import { AppError } from "../middleware/errorHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.js";
import { Client, type ClientDocument } from "../models/Client.js";
import { Job, type JobDocument } from "../models/Job.js";
import {
  createJobBodySchema,
  jobIdParamsSchema,
  listJobsQuerySchema,
  updateJobBodySchema,
  type CreateJobBody,
  type JobIdParams,
  type ListJobsQuery,
  type UpdateJobBody,
} from "../schemas/jobSchemas.js";
import { findOrCreateClient } from "../services/clientService.js";
import { buildClientSearchFilter } from "../services/clientSearch.js";
import {
  applyStatusTransition,
  getDisplayAt,
  matchesDisplayAtRange,
} from "../services/jobService.js";
import { escapeRegex } from "../utils/escapeRegex.js";

type Timestamps = {
  createdAt?: Date;
  updatedAt?: Date;
};

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

async function requireJob(id: string): Promise<JobDocument> {
  const job = await Job.findById(id).exec();
  if (!job) {
    throw new AppError("NOT_FOUND", "Job not found");
  }
  return job;
}

async function requireClient(clientId: string): Promise<ClientDocument> {
  const client = await Client.findById(clientId).exec();
  if (!client) {
    throw new AppError("NOT_FOUND", "Client not found");
  }
  return client;
}

async function listJobsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListJobsQuery;
  const filter: Record<string, unknown> = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.clientId) {
    filter.clientId = query.clientId;
  }

  if (query.q) {
    const q = query.q.trim();
    const searchOr: Record<string, unknown>[] = [
      { car: { $regex: escapeRegex(q), $options: "i" } },
    ];

    const matchingClients = await Client.find(buildClientSearchFilter(q))
      .select("_id")
      .exec();
    const clientIds = matchingClients.map((client) => client._id);
    if (clientIds.length > 0) {
      searchOr.push({ clientId: { $in: clientIds } });
    }

    filter.$or = searchOr;
  }

  const jobs = await Job.find(filter).sort({ scheduledAt: -1 }).exec();
  const filtered = jobs.filter((job) =>
    matchesDisplayAtRange(job, query.from, query.to),
  );

  const clientsById = await loadClientsById(
    [...new Set(filtered.map((job) => String(job.clientId)))],
  );

  const items = filtered.flatMap((job) => {
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

async function patchJobHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as JobIdParams;
  const body = req.body as UpdateJobBody;
  const job = await requireJob(id);

  let client = await requireClient(String(job.clientId));

  if (body.phone !== undefined) {
    const result = await findOrCreateClient({
      phone: body.phone,
      name: body.name,
    });
    client = result.client;
    job.clientId = result.client._id;
  } else if (body.name !== undefined) {
    const trimmed = body.name?.trim() ?? "";
    if (trimmed) {
      client.name = trimmed;
    } else {
      client.name = undefined;
    }
    await client.save();
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

  await job.save();

  res.status(200).json(serializeJob(job, client));
}

export function createJobsRouter(): Router {
  const router = Router();

  router.get("/", validateQuery(listJobsQuerySchema), listJobsHandler);
  router.post("/", validateBody(createJobBodySchema), createJobHandler);
  router.patch(
    "/:id",
    validateParams(jobIdParamsSchema),
    validateBody(updateJobBodySchema),
    patchJobHandler,
  );

  return router;
}
