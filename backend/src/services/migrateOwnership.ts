import { Admin } from "../models/Admin.js";
import { Client } from "../models/Client.js";
import { Job } from "../models/Job.js";

const missingAdminIdFilter = {
  $or: [{ adminId: { $exists: false } }, { adminId: null }],
};

function isIndexNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? (error as { code: unknown }).code : undefined;
  if (code === 27 || code === "IndexNotFound") {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  return /index not found/i.test(message);
}

/**
 * One-time ownership bootstrap:
 * - drop legacy global unique index on `clients.phoneNormalized`
 * - assign clients/jobs without `adminId` to the oldest Admin (when any exist)
 * - sync indexes to compound unique `(adminId, phoneNormalized)` and job owner indexes
 */
export async function migrateOwnership(): Promise<void> {
  try {
    await Client.collection.dropIndex("phoneNormalized_1");
    console.log('Dropped legacy index "clients.phoneNormalized_1"');
  } catch (error) {
    if (!isIndexNotFoundError(error)) {
      throw error;
    }
  }

  const oldestAdmin = await Admin.findOne()
    .sort({ createdAt: 1 })
    .select("_id")
    .exec();

  if (oldestAdmin) {
    const ownerId = oldestAdmin._id;

    const [clients, jobs] = await Promise.all([
      Client.updateMany(missingAdminIdFilter, { $set: { adminId: ownerId } }),
      Job.updateMany(missingAdminIdFilter, { $set: { adminId: ownerId } }),
    ]);

    if (clients.modifiedCount > 0 || jobs.modifiedCount > 0) {
      console.log(
        `Migrated ownership → admin ${String(ownerId)}: ${clients.modifiedCount} clients, ${jobs.modifiedCount} jobs`,
      );
    }
  } else {
    const orphanClients = await Client.countDocuments(missingAdminIdFilter);
    const orphanJobs = await Job.countDocuments(missingAdminIdFilter);
    if (orphanClients > 0 || orphanJobs > 0) {
      console.warn(
        `Ownership migration skipped (no admins yet): ${orphanClients} clients, ${orphanJobs} jobs still without adminId`,
      );
    }
  }

  await Client.syncIndexes();
  await Job.syncIndexes();
}
