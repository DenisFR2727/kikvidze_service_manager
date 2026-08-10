import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Windows / Node.js often fails MongoDB Atlas `mongodb+srv://` SRV lookups
 * with `querySrv ECONNREFUSED` when system DNS is loopback-only or broken.
 * Force public DNS + IPv4 before connecting.
 * @see https://mongoosejs.com/docs/faq.html
 */
function applyMongoDnsWorkaround(): void {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}

/**
 * Connect to MongoDB using validated `MONGODB_URI` (or an explicit override).
 */
export async function connectDB(
  uri: string = env.MONGODB_URI,
): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  applyMongoDnsWorkaround();
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { family: 4 });
  return mongoose;
}

/**
 * Close the MongoDB connection (useful for scripts/tests).
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
