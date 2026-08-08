import { z } from 'zod';

export const createBookingSchema = z.object({
  professionalId: z.string().min(1),
  shiftType: z.enum(['hourly', 'shift_12h', 'shift_24h', 'live_in']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  careNotes: z.string().max(500).optional().default(''),
  paymentMethodId: z.string().optional()
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end > start;
}, { message: 'endAt must be after startAt' });

export const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  reason: z.string().max(500).optional()
});

export const cancelSchema = z.object({
  reason: z.string().max(500).optional()
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default('')
});