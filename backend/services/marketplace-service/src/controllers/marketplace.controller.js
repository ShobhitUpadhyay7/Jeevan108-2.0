import { ListingCache } from '../models/ListingCache.model.js';
import { getRedis } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/v1/marketplace/listings (ADD §8.1)
export const getListings = async (req, res, next) => {
  try {
    const {
      role, lat, lng, radiusKm,
      priceMin, priceMax, ratingMin,
      languages, gender, sort = 'best_match',
      page = 1, limit = 20
    } = req.query;

    // Build cache key for Redis
    const cacheKey = `marketplace:listings:${JSON.stringify(req.query)}`;
    const redis = getRedis();
    
    // Try Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return res.status(200).json({ ...parsed, meta: { ...parsed.meta, cached: true, requestId: req.requestId } });
    }

    // Build MongoDB query
    const query = { isActive: true }; // Only show live professionals (PRD FR-3.1)

    if (role) query.roleType = { $in: role.split(',') };
    if (priceMin || priceMax) {
      query.startingPrice = {};
      if (priceMin) query.startingPrice.$gte = parseInt(priceMin);
      if (priceMax) query.startingPrice.$lte = parseInt(priceMax);
    }
    if (ratingMin) query.ratingAvg = { $gte: parseFloat(ratingMin) };
    if (languages) query.languages = { $in: languages.split(',') };

    // Sorting (ADD §8.1 sort options)
    let sortObj = {};
    switch (sort) {
      case 'price_asc': sortObj = { startingPrice: 1 }; break;
      case 'price_desc': sortObj = { startingPrice: -1 }; break;
      case 'rating': sortObj = { ratingAvg: -1, ratingCount: -1 }; break;
      case 'best_match':
      default: sortObj = { ratingAvg: -1, yearsExperience: -1, lastUpdated: -1 }; break;
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Cap at 50
    const skip = (pageNum - 1) * limitNum;

    const [listings, totalCount] = await Promise.all([
      ListingCache.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      ListingCache.countDocuments(query)
    ]);

    // Format response per ADD §8.1
    const formattedListings = listings.map(l => ({
      id: l.professionalId,
      fullName: l.fullName,
      roleType: l.roleType,
      verified: l.verified,
      ratingAvg: l.ratingAvg,
      ratingCount: l.ratingCount,
      yearsExperience: l.yearsExperience,
      startingPrice: l.startingPrice,
      currency: l.currency,
      distanceKm: null, // Would calculate from lat/lng in production
      nextAvailableDate: l.nextAvailableDate,
      photoUrl: l.photoUrl
    }));

    const response = {
      data: { listings: formattedListings },
      meta: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        hasMore: (pageNum * limitNum) < totalCount,
        requestId: req.requestId
      },
      error: null
    };

    // Cache in Redis for 60 seconds
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);

    res.status(200).json(response);
  } catch (error) { next(error); }
};

// POST /api/v1/marketplace/compare (ADD §8.2)
export const compareProfessionals = async (req, res, next) => {
  try {
    const { professionalIds } = req.body;

    if (!professionalIds || professionalIds.length < 2 || professionalIds.length > 3) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Must provide 2-3 professional IDs for comparison');
    }

    const professionals = await ListingCache.find({
      professionalId: { $in: professionalIds },
      isActive: true
    }).lean();

    if (professionals.length !== professionalIds.length) {
      throw new ApiError(404, 'NOT_FOUND', 'One or more professionals not found or inactive');
    }

    const comparison = professionals.map(p => ({
      id: p.professionalId,
      fullName: p.fullName,
      roleType: p.roleType,
      verified: p.verified,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      yearsExperience: p.yearsExperience,
      specializations: p.specializations,
      languages: p.languages,
      startingPrice: p.startingPrice,
      currency: p.currency,
      serviceRadiusKm: p.serviceRadiusKm
    }));

    res.status(200).json({
      data: { comparison },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// GET /internal/v1/marketplace/query — Internal API for AI Service (ADD §8.3)
export const internalQuery = async (req, res, next) => {
  try {
    const { roleType, specialization, limit = 3 } = req.body;

    const query = { isActive: true };
    if (roleType) query.roleType = roleType;
    if (specialization) query.specializations = specialization;

    const listings = await ListingCache.find(query)
      .sort({ ratingAvg: -1, yearsExperience: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      data: listings.map(l => ({
        professionalId: l.professionalId,
        fullName: l.fullName,
        roleType: l.roleType,
        ratingAvg: l.ratingAvg,
        startingPrice: l.startingPrice
      })),
      error: null
    });
  } catch (error) { next(error); }
};