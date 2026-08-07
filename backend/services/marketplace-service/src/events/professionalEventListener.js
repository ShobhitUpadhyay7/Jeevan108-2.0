import { subscribeTo } from '../config/rabbitmq.js';
import { ListingCache } from '../models/ListingCache.model.js';

export const startProfessionalEventListener = async () => {
  await subscribeTo('professional.created', 'marketplace-service-pro-events', handleProfessionalEvent);
  await subscribeTo('professional.updated', 'marketplace-service-pro-events', handleProfessionalEvent);
};

const handleProfessionalEvent = async (event) => {
  const payload = event.payload;
  
  await ListingCache.findOneAndUpdate(
    { professionalId: payload.professionalId },
    {
      fullName: payload.fullName,
      roleType: payload.roleType,
      verified: payload.verified,
      ratingAvg: payload.ratingAvg || 0,
      ratingCount: payload.ratingCount || 0,
      yearsExperience: payload.yearsExperience || 0,
      specializations: payload.specializations || [],
      languages: payload.languages || [],
      startingPrice: payload.pricing?.hourly || 50000,
      currency: payload.pricing?.currency || 'INR',
      location: payload.location,
      serviceRadiusKm: payload.serviceRadiusKm,
      isActive: payload.isActive,
      photoUrl: payload.photoUrl,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
  
  console.log(`[Marketplace] Updated listing cache for: ${payload.professionalId}`);
};