import mongoose, { model } from "mongoose";
import * as Mongoose from "mongoose";

import { DB_URI } from "../config";

import { customersSchema } from "./schemas/customers.schema";
import { stateSchema } from "./schemas/state.schema";

export const State = model("state", stateSchema);
export const Customer = model("customer", customersSchema);
export const CustomerAnonymised = model("customer-anonymised", customersSchema);

export const connect = async (): Promise<typeof Mongoose> => {
  return mongoose.connect(DB_URI, {
    readPreference: "primary",
  });
};

export async function execTransaction(callback) {
  const session = await mongoose.startSession();
  return session
    .withTransaction(callback)
    .then(() =>
      session
        .commitTransaction()
        .catch((err) => console.log("commitTransaction", err))
    )
    .catch((error) => {
      console.error("Transaction error:", error);
      session.abortTransaction();
    })
    .finally(() => session.endSession());

  // try {
  //   const result = session.withTransaction(callback);
  //   await session.commitTransaction();
  // } catch (err) {
  //   await session.abortTransaction();
  //   throw err;
  // } finally {
  //   session.endSession();
  // }

  // try {
  //   session.startTransaction();
  //   const result = await callback(session);
  //   await session.endSession();
  //   return result;
  // } catch (err) {
  //   await session.abortTransaction();
  //   throw err;
  // } finally {
  //   session.endSession();
  // }
}
