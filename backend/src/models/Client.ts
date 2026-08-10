import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const clientSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNormalized: {
      type: String,
      required: true,
      unique: true,
      index: true,
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

export type ClientFields = InferSchemaType<typeof clientSchema>;
export type ClientDocument = HydratedDocument<ClientFields>;

export const Client: Model<ClientFields> = model<ClientFields>(
  "Client",
  clientSchema,
);
