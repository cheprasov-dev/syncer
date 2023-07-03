import mongoose, { model } from "mongoose";
import * as Mongoose from "mongoose";

import { DB_URI } from "../config";

import { customersSchema } from "./schemas/customers.schema";

export const Customer = model("customer", customersSchema);
export const CustomerAnonymised = model("customer-anonymised", customersSchema);

export const connect = async (): Promise<typeof Mongoose> => {
  return mongoose.connect(DB_URI, {
    readPreference: "primary",
  });
};
