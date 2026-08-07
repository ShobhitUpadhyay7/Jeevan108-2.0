import mongoose from 'mongoose';

const professionalSchema = new mongoose.Schema(
  {
    professionalId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true }, // Links to Auth Service user
    applicationId: { type: String, required: true },
    
    fullName: { type: String, required: true },
    roleType: { type: String, enum: ['nurse', 'caretaker', 'compounder'], required: true },
    
    verified: { type: Boolean, default: true }, // Set true on creation (came from approved application)
    
    bio: { type: String, default: '' },
    yearsExperience: { type: Number, default: 0 },
    specializations: [String],
    languages: { type: [String], default: ['en', 'hi'] },
    certifications: [{
      title: String,
      issuer: String,
      verified: { type: Boolean, default: true }
    }],
    
    // Location & Service Area
    location: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
      city: { type: String, default: 'Bengaluru' }
    },
    serviceRadiusKm: { type: Number, default: 10 },
    
    // Pricing (in paise as per ADD §1)
    pricing: {
      hourly: { type: Number, default: 50000 },       // ₹500
      shift12h: { type: Number, default: 250000 },    // ₹2500
      shift24h: { type: Number, default: 450000 },    // ₹4500
      liveIn: { type: Number, default: 3000000 },     // ₹30000
      currency: { type: String, default: 'INR' }
    },
    
    // Ratings (aggregated from reviews)
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    
    // Availability
    availability: {
      blockedDates: [String], // ISO date strings
      weeklyPattern: {
        mon: { type: Boolean, default: true },
        tue: { type: Boolean, default: true },
        wed: { type: Boolean, default: true },
        thu: { type: Boolean, default: true },
        fri: { type: Boolean, default: true },
        sat: { type: Boolean, default: true },
        sun: { type: Boolean, default: true }
      }
    },
    
    // Status
    isActive: { type: Boolean, default: false }, // Becomes true after professional confirms availability
    photoUrl: { type: String, default: null }
  },
  { timestamps: true }
);

professionalSchema.index({ roleType: 1, isActive: 1 });
professionalSchema.index({ 'location.lat': 1, 'location.lng': 1 });
professionalSchema.index({ ratingAvg: -1 });

export const Professional = mongoose.model('Professional', professionalSchema);