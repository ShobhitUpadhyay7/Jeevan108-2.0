import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    
    patientId: { type: String, required: true, index: true },
    professionalId: { type: String, required: true, index: true },
    
    shiftType: {
      type: String,
      enum: ['hourly', 'shift_12h', 'shift_24h', 'live_in'],
      required: true
    },
    
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    
    status: {
      type: String,
      enum: ['requested', 'accepted', 'declined', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'requested',
      index: true
    },
    
    careNotes: { type: String, maxlength: 500, default: '' },
    
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      breakdown: {
        base: Number,
        platformFee: Number
      }
    },
    
    slaExpiresAt: { type: Date, required: true },
    
    declinedReason: { type: String, default: null },
    cancelledBy: { type: String, default: null },
    cancelledReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    
    reviewed: { type: Boolean, default: false },
    reviewId: { type: String, default: null }
  },
  { timestamps: true }
);

// Compound index for conflict detection
bookingSchema.index({ professionalId: 1, startAt: 1, endAt: 1, status: 1 });
bookingSchema.index({ patientId: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);