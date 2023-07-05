import { HydratedDocument, Schema } from "mongoose";

interface IAddress {
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
}

export interface ICustomer {
  firstName: string;
  lastName: string;
  email: string;
  address: IAddress;
}

export const customersSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },

    address: {
      line1: { type: String, required: true },
      line2: { type: String, required: true },
      postcode: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export type CustomersDocument = HydratedDocument<ICustomer>;
