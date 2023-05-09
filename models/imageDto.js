import {Schema} from "mongoose";
export const imageDto = new Schema({
    date: {
      type: Date,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  });
  