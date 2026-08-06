import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connect to MongoDB using validated `MONGODB_URI` (or an explicit override).
 */
export async function connectDB(
  uri: string = env.MONGODB_URI,
): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
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
