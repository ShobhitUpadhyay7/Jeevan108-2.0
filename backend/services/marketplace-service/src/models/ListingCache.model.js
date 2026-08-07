import mongoose from 'mongoose';

const listingCacheSchema = new mongoose.Schema(
  {
    professionalId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    roleType: { type: String, required: true, index: true },
    verified: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    yearsExperience: { type: Number, default: 0 },
    specializations: [String],
    languages: [String],
    startingPrice: { type: Number, default: 50000 }, // hourly rate in paise
    currency: { type: String, default: 'INR' },
    location: {
      lat: Number,
      lng: Number,
      city: String
    },
    serviceRadiusKm: Number,
    isActive: { type: Boolean, default: false, index: true },
    photoUrl: String,
    nextAvailableDate: { type: String, default: null },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

listingCacheSchema.index({ roleType: 1, isActive: 1, ratingAvg: -1 });
listingCacheSchema.index({ startingPrice: 1 });

export const ListingCache = mongoose.model('ListingCache', listingCacheSchema);