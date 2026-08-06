import { UserProfile } from '../models/UserProfile.model.js';
import { ApiError } from '../utils/ApiError.js';

export const getMe = async (req, res, next) => {
  try {
    // DEBUG LOG: Print all incoming headers to the console
    console.log('[User Service] Incoming headers:', req.headers);

    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      throw new ApiError(
        401,
        'UNAUTHENTICATED',
        'User context missing. This route must be accessed through the API Gateway.'
      );
    }

    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      throw new ApiError(404, 'NOT_FOUND', 'Profile is still being created. Please retry in a moment.');
    }

    res.status(200).json({
      data: {
        id: profile.userId,
        fullName: profile.fullName,
        role: req.headers['x-user-role'] || null,
        addresses: profile.addresses || [],
        preferences: profile.preferences || {},
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
      error: null
    });
  } catch (error) {
    next(error);
  }
};