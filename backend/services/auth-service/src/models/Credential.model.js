import mongoose from "mongoose";

const credentialSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "professional", "staff", "admin"],
      default: "patient",
    },
    status: {
      type: String,
      enum: ["active", "pending_verification", "suspended"],
      default: "active",
    },
  },
  { timestamps: true },
);

export const Credential = mongoose.model("Credential", credentialSchema);
