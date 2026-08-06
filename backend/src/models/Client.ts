import { Schema, model, type InferSchemaType, type Model } from "mongoose";

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

export type ClientDocument = InferSchemaType<typeof clientSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Client: Model<ClientDocument> = model<ClientDocument>(
  "Client",
  clientSchema,
);
