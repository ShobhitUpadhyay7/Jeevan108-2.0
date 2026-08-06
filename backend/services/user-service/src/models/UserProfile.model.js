import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    line1: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // References Auth Credential ID
    fullName: { type: String, required: true, trim: true },
    addresses: [addressSchema],
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
