import { Booking } from '../models/Booking.model.js';

/**
 * Checks if a new booking would overlap with existing bookings.
 * Two time ranges [startA, endA] and [startB, endB] overlap if:
 * startA < endB AND startB < endA
 */
export const checkConflict = async (professionalId, startAt, endAt) => {
  const conflictStatuses = ['requested', 'accepted', 'confirmed', 'in_progress'];
  
  const conflicting = await Booking.findOne({
    professionalId,
    status: { $in: conflictStatuses },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt }
  });
  
  return conflicting ? conflicting.bookingId : null;
};