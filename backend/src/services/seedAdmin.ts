import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";

const BCRYPT_ROUNDS = 10;

/**
 * Seed the single v1 admin from env when the `admins` collection is empty.
 */
export async function seedAdminIfMissing(): Promise<void> {
  const existingCount = await Admin.countDocuments();
  if (existingCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await Admin.create({
    login: env.ADMIN_LOGIN,
    passwordHash,
  });

  console.log(`Seeded admin "${env.ADMIN_LOGIN}"`);
}
