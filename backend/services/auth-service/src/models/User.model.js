import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['patient', 'professional', 'staff', 'admin'], 
      default: 'patient' 
    },
    status: {
      type: String,
      enum: ['active', 'pending_verification', 'suspended'],
      default: 'active' // Mocking OTP verification for MVP speed
    }
  },
  { timestamps: true }
);

// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);