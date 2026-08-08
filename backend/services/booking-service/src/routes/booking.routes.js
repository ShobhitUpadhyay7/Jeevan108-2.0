import { Router } from 'express';
import {
  createBooking,
  getBooking,
  getBookings,
  respondToBooking,
  cancelBooking,
  completeBooking,
  reviewBooking
} from '../controllers/booking.controller.js';

const router = Router();

router.post('/', createBooking);
router.get('/:bookingId', getBooking);
router.get('/', getBookings);
router.post('/:bookingId/respond', respondToBooking);
router.post('/:bookingId/cancel', cancelBooking);
router.post('/:bookingId/complete', completeBooking);
router.post('/:bookingId/review', reviewBooking);

export default router;