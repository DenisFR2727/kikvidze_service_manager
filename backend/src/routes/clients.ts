import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { AppError } from "../middleware/errorHandler.js";
import { validateParams, validateQuery } from "../middleware/validate.js";
import { Client, type ClientDocument } from "../models/Client.js";
import { Job } from "../models/Job.js";
import {
  clientIdParamsSchema,
  listClientsQuerySchema,
  type ClientIdParams,
  type ListClientsQuery,
} from "../schemas/clientSchemas.js";
import { buildClientSearchFilter } from "../services/clientSearch.js";

function serializeClientListItem(
  client: ClientDocument,
  jobsCount: number,
) {
  return {
    id: String(client._id),
    phone: client.phone,
    name: client.name ?? null,
    jobsCount,
  };
}

async function countJobsByClientId(
  clientIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(
    clientIds.map((id) => [id, 0]),
  );

  if (clientIds.length === 0) {
    return counts;
  }

  const objectIds = clientIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  const rows = await Job.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { clientId: { $in: objectIds } } },
    { $group: { _id: "$clientId", count: { $sum: 1 } } },
  ]).exec();

  for (const row of rows) {
    counts.set(String(row._id), row.count);
  }

  return counts;
}

async function listClientsHandler(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListClientsQuery;
  const filter = query.q ? buildClientSearchFilter(query.q) : {};

  const clients = await Client.find(filter).sort({ phoneNormalized: 1 }).exec();
  const jobsCountById = await countJobsByClientId(
    clients.map((client) => String(client._id)),
  );

  res.status(200).json({
    items: clients.map((client) =>
      serializeClientListItem(
        client,
        jobsCountById.get(String(client._id)) ?? 0,
      ),
    ),
  });
}

async function getClientHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as ClientIdParams;
  const client = await Client.findById(id).exec();
  if (!client) {
    throw new AppError("NOT_FOUND", "Client not found");
  }

  const jobsCount = await Job.countDocuments({ clientId: client._id }).exec();

  res.status(200).json({
    ...serializeClientListItem(client, jobsCount),
  });
}

export function createClientsRouter(): Router {
  const router = Router();

  router.get("/", validateQuery(listClientsQuerySchema), listClientsHandler);
  router.get(
    "/:id",
    validateParams(clientIdParamsSchema),
    getClientHandler,
  );

  return router;
}
