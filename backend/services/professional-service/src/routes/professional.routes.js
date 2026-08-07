import { Router } from 'express';
import {
  getProfile,
  getMyProfile,
  updateMyProfile,
  getAvailability,
  updateAvailability,
  createProfessionalInternal
} from '../controllers/professional.controller.js';

const router = Router();

// Public routes
router.get('/:id', getProfile);

// Authenticated routes (professional's own data)
router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.get('/me/availability', getAvailability);
router.put('/me/availability', updateAvailability);

// Internal routes (not exposed via public gateway)
router.post('/internal/create', createProfessionalInternal);

export default router;