import { Booking } from '../models/Booking.model.js';

export const bookingAnalyticsSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, pendingRequests, confirmedUpcoming, completedThisMonth, cancelledThisMonth] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'requested' }),
      Booking.countDocuments({ status: 'confirmed', startAt: { $gte: now } }),
      Booking.countDocuments({ status: 'completed', completedAt: { $gte: monthStart } }),
      Booking.countDocuments({ status: 'cancelled', cancelledAt: { $gte: monthStart } }),
    ]);

    res.status(200).json({
      data: { bookings: { total, pendingRequests, confirmedUpcoming, completedThisMonth, cancelledThisMonth } },
      error: null
    });
  } catch (error) { next(error); }
};