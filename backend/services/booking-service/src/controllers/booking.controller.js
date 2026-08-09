import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../models/Booking.model.js';
import { Review } from '../models/Review.model.js';
import { publishEvent } from '../config/rabbitmq.js';
import { checkConflict } from '../services/conflict.service.js';
import { calculatePrice } from '../services/pricing.service.js';
import { checkIdempotencyKey, storeIdempotencyKey } from '../services/idempotency.service.js';
import { ProfessionalCache } from '../models/ProfessionalCache.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createBookingSchema,
  respondSchema,
  cancelSchema,
  reviewSchema
} from '../validators/booking.validator.js';

// POST /api/v1/bookings — Create booking (ADD §9.1)
export const createBooking = async (req, res, next) => {
  try {
    const patientId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!patientId) throw new ApiError(401, 'UNAUTHENTICATED', 'User context missing');
    if (userRole !== 'patient') throw new ApiError(403, 'FORBIDDEN', 'Only patients can create bookings');

    // Validate Idempotency-Key header (ADD §1)
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Idempotency-Key header is required');
    }

    // Check if this request was already processed (retry safety)
    const cached = await checkIdempotencyKey(idempotencyKey);
    if (cached) {
      return res.status(cached.statusCode).json(cached.body);
    }

    // Validate request body
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid booking data', parsed.error.flatten());
    }

    const { professionalId, shiftType, startAt, endAt, careNotes } = parsed.data;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    // Validation: start time must be ≥ now + 2 hours (ADD §9.1)
    const minLeadHours = parseInt(process.env.MIN_BOOKING_LEAD_HOURS || '2', 10);
    const minStartTime = new Date(Date.now() + minLeadHours * 60 * 60 * 1000);
    if (startDate < minStartTime) {
      throw new ApiError(422, 'BOOKING_TOO_SOON', `Booking start time must be at least ${minLeadHours} hours from now`);
    }

    // Validation: end must be after start
    if (endDate <= startDate) {
      throw new ApiError(400, 'INVALID_TIME_RANGE', 'endAt must be after startAt');
    }

    // Fetch professional details (internal service call)
    const professional = await ProfessionalCache.findOne({ professionalId });

    if (!professional) {
      throw new ApiError(404, 'NOT_FOUND', 'Professional not found in local cache. They may not be fully onboarded yet.');
    }

    if (!professional.isActive) {
      throw new ApiError(422, 'PROFESSIONAL_INACTIVE', 'This professional is not currently accepting bookings');
    }

    // Conflict detection (ADD §9.1)
    const conflictingBookingId = await checkConflict(professionalId, startDate, endDate);
    if (conflictingBookingId) {
      throw new ApiError(409, 'BOOKING_CONFLICT', 'The selected professional is already booked for this time range', {
        conflictingBookingId
      });
    }

    // Calculate pricing
    const price = calculatePrice(professional.pricing, shiftType);

    // Calculate SLA expiry (default 2 hours from now)
    const slaHours = parseInt(process.env.BOOKING_SLA_HOURS || '2', 10);
    const slaExpiresAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    // Create booking
    const bookingId = `bk_${uuidv4().slice(0, 8)}`;
    const booking = await Booking.create({
      bookingId,
      idempotencyKey,
      patientId,
      professionalId,
      shiftType,
      startAt: startDate,
      endAt: endDate,
      status: 'requested',
      careNotes,
      price,
      slaExpiresAt
    });

    // Publish event (ADD §14.4)
    await publishEvent('booking.requested', {
      bookingId: booking.bookingId,
      patientId: booking.patientId,
      professionalId: booking.professionalId,
      professionalUserId: professional.userId,
      shiftType: shiftType,
      startAt: booking.startAt.toISOString(),
      slaExpiresAt: booking.slaExpiresAt.toISOString()
    });

    const responseBody = {
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        price: booking.price,
        slaExpiresAt: booking.slaExpiresAt.toISOString()
      },
      meta: { requestId: req.requestId },
      error: null
    };

    // Store idempotency response
    await storeIdempotencyKey(idempotencyKey, { statusCode: 201, body: responseBody });

    res.status(201).json(responseBody);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/bookings/:bookingId — Get booking details (ADD §9.2)
export const getBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');

    // Access control: patient, professional, staff, or admin
    if (userRole !== 'staff' && userRole !== 'admin') {
      if (booking.patientId !== userId && booking.professionalId !== userId) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this booking');
      }
    }

    res.status(200).json({
      data: booking,
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/bookings — List bookings (ADD §9.3)
export const getBookings = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { status, from, to, page = 1, limit = 20 } = req.query;

    // Role-aware query
    let query = {};
    if (userRole === 'patient') {
      query.patientId = userId;
    } else if (userRole === 'professional') {
      const proCache = await ProfessionalCache.findOne({ userId });
      query.professionalId = proCache ? proCache.professionalId : 'non_existent_id';
    } else if (userRole === 'staff' || userRole === 'admin') {
      // Staff/admin see all bookings
    }

    if (status) query.status = status;
    if (from) query.startAt = { $gte: new Date(from) };
    if (to) query.startAt = { ...query.startAt, $lte: new Date(to) };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Booking.countDocuments(query)
    ]);

    res.status(200).json({
      data: { bookings },
      meta: { totalCount, page: pageNum, limit: limitNum, hasMore: (pageNum * limitNum) < totalCount, requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/bookings/:bookingId/respond — Professional accept/decline (ADD §9.4)
export const respondToBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { bookingId } = req.params;

    if (userRole !== 'professional') {
      throw new ApiError(403, 'FORBIDDEN', 'Only professionals can respond to booking requests');
    }

    // TRANSLATE userId -> professionalId
    const proCache = await ProfessionalCache.findOne({ userId });
    if (!proCache) throw new ApiError(404, 'NOT_FOUND', 'Professional profile not found in cache');

    const parsed = respondSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid response', parsed.error.flatten());
    }

    const booking = await Booking.findOne({ bookingId, professionalId: proCache.professionalId });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');

    if (booking.status !== 'requested') {
      throw new ApiError(409, 'INVALID_STATE', `Cannot respond to booking in ${booking.status} state`);
    }

    // Check if SLA has expired
    if (new Date() > booking.slaExpiresAt) {
      booking.status = 'cancelled';
      booking.cancelledBy = 'system';
      booking.cancelledReason = 'SLA expired without response';
      booking.cancelledAt = new Date();
      await booking.save();

      await publishEvent('booking.cancelled', {
        bookingId: booking.bookingId,
        cancelledBy: 'system',
        reason: 'SLA expired without response'
      });

      throw new ApiError(410, 'BOOKING_EXPIRED', 'This booking request has expired');
    }

    if (parsed.data.action === 'accept') {
      booking.status = 'confirmed';
      await booking.save();

      await publishEvent('booking.confirmed', {
        bookingId: booking.bookingId,
        professionalId: booking.professionalId,
        professionalUserId: proCache.userId,
        patientId: booking.patientId,
        startAt: booking.startAt.toISOString()
      });
    } else if (parsed.data.action === 'decline') {
      booking.status = 'declined';
      booking.declinedReason = parsed.data.reason || 'Not available';
      await booking.save();
    }

    res.status(200).json({
      data: { bookingId: booking.bookingId, status: booking.status },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/bookings/:bookingId/cancel — Cancel booking (ADD §9.6)
export const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { bookingId } = req.params;

    const parsed = cancelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid cancel data', parsed.error.flatten());
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');

    // Access control
    if (userRole !== 'staff' && userRole !== 'admin') {
      if (booking.patientId !== userId) {
        const proCache = await ProfessionalCache.findOne({ userId });
        if (!proCache || booking.professionalId !== proCache.professionalId) {
          throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this booking');
        }
      }
    }

    const cancellableStatuses = ['requested', 'accepted', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new ApiError(409, 'INVALID_STATE', `Cannot cancel booking in ${booking.status} state`);
    }

    booking.status = 'cancelled';
    booking.cancelledBy = userId;
    booking.cancelledReason = parsed.data.reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    await booking.save();

    await publishEvent('booking.cancelled', {
      bookingId: booking.bookingId,
      professionalUserId: proCache ? proCache.userId : null,
      cancelledBy: userId,
      reason: parsed.data.reason || 'Cancelled by user'
    });

    res.status(200).json({
      data: { bookingId: booking.bookingId, status: 'cancelled' },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/bookings/:bookingId/complete — Complete booking (ADD §9.7)
export const completeBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');

    // Access control: professional or staff/admin can complete
    if (userRole === 'patient') {
      throw new ApiError(403, 'FORBIDDEN', 'Only professionals or staff can complete bookings');
    }
    if (userRole === 'professional') {
      const proCache = await ProfessionalCache.findOne({ userId });
      if (!proCache || booking.professionalId !== proCache.professionalId) {
        throw new ApiError(403, 'FORBIDDEN', 'You are not assigned to this booking');
      }
    }
    if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
      throw new ApiError(409, 'INVALID_STATE', `Cannot complete booking in ${booking.status} state`);
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    res.status(200).json({
      data: { bookingId: booking.bookingId, status: 'completed' },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/bookings/:bookingId/review — Submit review (ADD §9.8)
export const reviewBooking = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { bookingId } = req.params;

    if (userRole !== 'patient') {
      throw new ApiError(403, 'FORBIDDEN', 'Only patients can review bookings');
    }

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid review data', parsed.error.flatten());
    }

    const booking = await Booking.findOne({ bookingId, patientId: userId });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');

    if (booking.status !== 'completed') {
      throw new ApiError(409, 'INVALID_STATE', 'Can only review completed bookings');
    }

    if (booking.reviewed) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', 'This booking has already been reviewed');
    }

    const reviewId = `rev_${uuidv4().slice(0, 8)}`;
    await Review.create({
      reviewId,
      bookingId: booking.bookingId,
      professionalId: booking.professionalId,
      professionalUserId: proCache ? proCache.userId : null,
      patientId: userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment
    });

    booking.reviewed = true;
    booking.reviewId = reviewId;
    await booking.save();

    // Publish review event (ADD §14.9)
    await publishEvent('review.submitted', {
      bookingId: booking.bookingId,
      professionalId: booking.professionalId,
      rating: parsed.data.rating
    });

    res.status(201).json({
      data: { reviewId, rating: parsed.data.rating },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};