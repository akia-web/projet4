import {Schema} from "mongoose";
export const imageDto = new Schema({
    date: {
      type: Date,
      required: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
    },
    name:{
        type: String,
        required:true
    },
    url:{
        type: String,
        required: true,
    },
    userId:{
        type: String,
        required: true
    }
  });
  