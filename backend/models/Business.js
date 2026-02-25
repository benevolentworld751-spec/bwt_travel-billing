// models/Business.js
import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema({
  accountName: { type: String, default: "" },
  accountNumber: { type: String, default: "" },
  ifsc: { type: String, default: "" },
  bankName: { type: String, default: "" },
  branch: { type: String, default: "" },
}, { _id: false });

const businessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Business must be associated with a user"],
    },
    name: { type: String, required: true, trim: true },
    gstNumber: { type: String, trim: true, default: "" },
    address: { type: String, required: true, trim: true },
    phone: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\+?[0-9]{7,15}$/.test(v),
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    email: { 
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => /^\S+@\S+\.\S+$/.test(v),
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    logoUrl: { type: String, default: "" },
    upiId: { type: String, default: "" },           // <-- Add this
    signatureUrl: { type: String, default: "" },    // <-- Add this
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const Business = mongoose.model("Business", businessSchema);
export default Business;