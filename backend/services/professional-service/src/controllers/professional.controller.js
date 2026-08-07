import { Professional } from '../models/Professional.model.js';
import { publishEvent } from '../config/rabbitmq.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/v1/professionals/:id — Public profile (ADD §7.1)
export const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findOne({ professionalId: id });
    if (!professional) throw new ApiError(404, 'NOT_FOUND', 'Professional not found');

    res.status(200).json({
      data: {
        id: professional.professionalId,
        fullName: professional.fullName,
        roleType: professional.roleType,
        verified: professional.verified,
        ratingAvg: professional.ratingAvg,
        ratingCount: professional.ratingCount,
        yearsExperience: professional.yearsExperience,
        specializations: professional.specializations,
        languages: professional.languages,
        serviceRadiusKm: professional.serviceRadiusKm,
        pricing: professional.pricing,
        bio: professional.bio,
        certifications: professional.certifications,
        isActive: professional.isActive
      },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// GET /api/v1/professionals/me — Own profile
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const professional = await Professional.findOne({ userId });
    if (!professional) throw new ApiError(404, 'NOT_FOUND', 'No professional profile found');

    res.status(200).json({
      data: professional,
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// PATCH /api/v1/professionals/me — Self-service edits (ADD §7.2)
export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const professional = await Professional.findOne({ userId });
    if (!professional) throw new ApiError(404, 'NOT_FOUND', 'No professional profile found');

    // Only allow editable fields (not verified/ratingAvg — system controlled)
    const editableFields = ['bio', 'yearsExperience', 'specializations', 'languages', 'pricing', 'serviceRadiusKm', 'photoUrl', 'isActive'];
    const updates = {};
    for (const field of editableFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    Object.assign(professional, updates);
    await professional.save();

    // Publish update event for Marketplace cache rebuild
    await publishEvent('professional.updated', {
      professionalId: professional.professionalId,
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

    res.status(200).json({
      data: professional,
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// GET /api/v1/professionals/me/availability (ADD §7.3)
export const getAvailability = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const professional = await Professional.findOne({ userId }, 'availability');
    if (!professional) throw new ApiError(404, 'NOT_FOUND', 'No professional profile found');

    res.status(200).json({
      data: professional.availability,
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/professionals/me/availability (ADD §7.3)
export const updateAvailability = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const professional = await Professional.findOne({ userId });
    if (!professional) throw new ApiError(404, 'NOT_FOUND', 'No professional profile found');

    professional.availability = req.body;
    professional.isActive = true; // Confirming availability makes them live (PRD FR-2.5)
    await professional.save();

    // Publish for marketplace cache update
    await publishEvent('professional.updated', {
      professionalId: professional.professionalId,
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

    res.status(200).json({
      data: { message: 'Availability updated. Profile is now live on marketplace.', isActive: true },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// POST /internal/v1/professionals — Internal API for direct creation (ADD §13)
export const createProfessionalInternal = async (req, res, next) => {
  try {
    const { userId, applicationId, fullName, roleType, yearsExperience, specializations } = req.body;
    
    const existing = await Professional.findOne({ applicationId });
    if (existing) {
      return res.status(200).json({ data: existing, error: null });
    }

    const { v4: uuidv4 } = await import('uuid');
    const professionalId = `pro_${uuidv4().slice(0, 8)}`;

    const professional = await Professional.create({
      professionalId, userId, applicationId, fullName, roleType,
      yearsExperience: yearsExperience || 0,
      specializations: specializations || []
    });

    res.status(201).json({ data: professional, error: null });
  } catch (error) { next(error); }
};