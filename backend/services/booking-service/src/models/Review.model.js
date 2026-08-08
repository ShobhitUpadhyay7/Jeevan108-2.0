import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true, unique: true },
    professionalId: { type: String, required: true, index: true },
    patientId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);