import { Schema } from "mongoose";

export interface IState {
  resumeToken: object;
}

export const stateSchema = new Schema<IState>(
  {
    resumeToken: { type: Object, required: true },
  },
  {
    timestamps: true,
  }
);
