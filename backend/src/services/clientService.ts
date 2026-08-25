import type { Types } from "mongoose";
import { AppError } from "../middleware/errorHandler.js";
import { Client, type ClientDocument } from "../models/Client.js";
import { parsePhone } from "../utils/phone.js";

export type FindOrCreateClientInput = {
  adminId: Types.ObjectId | string;
  phone: string;
  name?: string | null;
};

export type FindOrCreateClientResult = {
  client: ClientDocument;
  created: boolean;
};

function trimOptionalName(name?: string | null): string | undefined {
  if (name == null) {
    return undefined;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePhoneOrThrow(phone: string) {
  try {
    return parsePhone(phone);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid phone number";
    throw new AppError("VALIDATION_ERROR", message, {
      fields: { phone: message },
    });
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

/**
 * Find an existing Client by normalized phone within an admin's scope, or create one.
 * Uniqueness is `(adminId, phoneNormalized)` per FR-011.
 */
export async function findOrCreateClient(
  input: FindOrCreateClientInput,
): Promise<FindOrCreateClientResult> {
  const { phoneNormalized, phone } = parsePhoneOrThrow(input.phone);
  const name = trimOptionalName(input.name);
  const adminId = input.adminId;

  const existing = await Client.findOne({ adminId, phoneNormalized }).exec();
  if (existing) {
    return { client: existing, created: false };
  }

  try {
    const client = await Client.create({
      adminId,
      phone,
      phoneNormalized,
      ...(name !== undefined ? { name } : {}),
    });

    return { client, created: true };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const raced = await Client.findOne({ adminId, phoneNormalized }).exec();
    if (!raced) {
      throw error;
    }

    return { client: raced, created: false };
  }
}

/**
 * Load a client by id only if it belongs to `adminId`.
 * Missing or foreign ownership → `404 NOT_FOUND` (no existence leak).
 */
export async function requireClientOwnedByAdmin(
  id: string,
  adminId: Types.ObjectId | string,
): Promise<ClientDocument> {
  const client = await Client.findOne({ _id: id, adminId }).exec();
  if (!client) {
    throw new AppError("NOT_FOUND", "Client not found");
  }
  return client;
}
