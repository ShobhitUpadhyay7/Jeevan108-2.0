import { subscribeTo, publishEvent } from '../config/rabbitmq.js';
import { Professional } from '../models/Professional.model.js';

export const startReviewEventListener = async () => {
  await subscribeTo('review.submitted', 'professional-service-review-events', handleReviewSubmitted);
};

const handleReviewSubmitted = async (event) => {
  const { professionalId, rating } = event.payload;

  const professional = await Professional.findOne({ professionalId });
  if (!professional) {
    console.log(`[Professional] No professional found for review: ${professionalId}`);
    return;
  }

  // Recalculate rating average
  const totalRating = (professional.ratingAvg * professional.ratingCount) + rating;
  const newCount = professional.ratingCount + 1;
  const newAvg = Math.round((totalRating / newCount) * 10) / 10;

  professional.ratingAvg = newAvg;
  professional.ratingCount = newCount;
  await professional.save();

  console.log(`[Professional] Updated rating for ${professionalId}: ${newAvg} (${newCount} reviews)`);

  await publishEvent('professional.updated', {
    professionalId: professional.professionalId,
    userId: professional.userId,
    fullName: professional.fullName,
    roleType: professional.roleType,
    verified: professional.verified,
    ratingAvg: professional.ratingAvg,       // New rating
    ratingCount: professional.ratingCount,   // New count
    yearsExperience: professional.yearsExperience,
    specializations: professional.specializations,
    languages: professional.languages,
    pricing: professional.pricing,
    location: professional.location,
    serviceRadiusKm: professional.serviceRadiusKm,
    isActive: professional.isActive,
    photoUrl: professional.photoUrl
  });
};