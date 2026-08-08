import mongoose from 'mongoose';

// This is a read-only projection of the Professional Service's data.
// The Booking Service owns this cache and updates it via RabbitMQ events.
const professionalCacheSchema = new mongoose.Schema(
  {
    professionalId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true, index: true },
    fullName: String,
    roleType: String,
    isActive: { type: Boolean, default: false },
    pricing: {
      hourly: { type: Number, default: 50000 },
      shift12h: { type: Number, default: 250000 },
      shift24h: { type: Number, default: 450000 },
      liveIn: { type: Number, default: 3000000 },
      currency: { type: String, default: 'INR' }
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ProfessionalCache = mongoose.model('ProfessionalCache', professionalCacheSchema);