import { Schema, model, type InferSchemaType, type Model } from "mongoose";

export const JOB_STATUSES = [
  "queued",
  "in_progress",
  "done",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

const nonNegativeNumber = {
  type: Number,
  required: true,
  min: [0, "must be ≥ 0"],
} as const;

const jobSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    car: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: undefined,
      index: true,
    },
    workPrice: nonNegativeNumber,
    materialPrice: nonNegativeNumber,
    status: {
      type: String,
      enum: JOB_STATUSES,
      required: true,
      default: "queued",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "jobs",
  },
);

export type JobDocument = InferSchemaType<typeof jobSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Job: Model<JobDocument> = model<JobDocument>("Job", jobSchema);
