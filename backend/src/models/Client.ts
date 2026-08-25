import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const clientSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNormalized: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: "clients",
  },
);

/** Phone uniqueness is per admin (FR-011). */
clientSchema.index({ adminId: 1, phoneNormalized: 1 }, { unique: true });

export type ClientFields = InferSchemaType<typeof clientSchema>;
export type ClientDocument = HydratedDocument<ClientFields>;

export const Client: Model<ClientFields> = model<ClientFields>(
  "Client",
  clientSchema,
);
