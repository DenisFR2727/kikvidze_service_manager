import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const adminSchema = new Schema(
  {
    login: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "admins",
  },
);

export type AdminDocument = InferSchemaType<typeof adminSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Admin: Model<AdminDocument> = model<AdminDocument>(
  "Admin",
  adminSchema,
);
