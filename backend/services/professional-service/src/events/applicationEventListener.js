import { v4 as uuidv4 } from 'uuid';
import { subscribeTo, publishEvent } from '../config/rabbitmq.js';
import { Professional } from '../models/Professional.model.js';

export const startApplicationEventListener = async () => {
  await subscribeTo(
    'application.status_changed',
    'professional-service-app-events',
    handleStatusChanged
  );
};

const handleStatusChanged = async (event) => {
  const { applicationId, newStatus, professionalUserId } = event.payload;
  
  if (newStatus !== 'approved') return;
  
  // Check if profile already exists (idempotency)
  const existing = await Professional.findOne({ applicationId });
  if (existing) {
    console.log(`[Professional] Profile already exists for application: ${applicationId}`);
    return;
  }
  
  const professionalId = `pro_${uuidv4().slice(0, 8)}`;
  
  const professional = await Professional.create({
    professionalId,
    userId: professionalUserId,
    applicationId,
    fullName: event.payload.fullName || 'New Professional',
    roleType: event.payload.roleType || 'nurse',
    yearsExperience: event.payload.yearsExperience || 0,
    specializations: event.payload.specializations || [],
    isActive: false // Professional must confirm availability to go live
  });
  
  console.log(`[Professional] Created profile: ${professionalId} for user: ${professionalUserId}`);
  
  // Publish event for Marketplace Service to build listing cache
  await publishEvent('professional.created', {
    professionalId: professional.professionalId,
    userId: professional.userId,
    fullName: professional.fullName,
    roleType: professional.roleType,
    verified: professional.verified,
    ratingAvg: professional.ratingAvg,
    ratingCount: professional.ratingCount,
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