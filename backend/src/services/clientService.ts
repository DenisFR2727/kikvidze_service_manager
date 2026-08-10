import { AppError } from "../middleware/errorHandler.js";
import { Client, type ClientDocument } from "../models/Client.js";
import { parsePhone } from "../utils/phone.js";

export type FindOrCreateClientInput = {
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
 * Find an existing Client by normalized phone or create a new one.
 * Uniqueness is enforced on `phoneNormalized` (FR-023/024).
 */
export async function findOrCreateClient(
  input: FindOrCreateClientInput,
): Promise<FindOrCreateClientResult> {
  const { phoneNormalized, phone } = parsePhoneOrThrow(input.phone);
  const name = trimOptionalName(input.name);

  const existing = await Client.findOne({ phoneNormalized }).exec();
  if (existing) {
    return { client: existing, created: false };
  }

  try {
    const client = await Client.create({
      phone,
      phoneNormalized,
      ...(name !== undefined ? { name } : {}),
    });

    return { client, created: true };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const raced = await Client.findOne({ phoneNormalized }).exec();
    if (!raced) {
      throw error;
    }

    return { client: raced, created: false };
  }
}
