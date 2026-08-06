import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+91[0-9]{10}$/, "Invalid Indian phone format (e.g., +919876543210)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(['patient', 'professional']).default('patient')
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required")
});