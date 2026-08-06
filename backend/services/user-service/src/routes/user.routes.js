import { Router } from 'express';

import { getMe } from '../controllers/user.controller.js';

const router = Router();

/**
 * GET /api/v1/users/me
 *
 * This route is protected by the API Gateway.
 * The Gateway has already verified the JWT.
 *
 * User Service trusts:
 * - x-user-id
 * - x-user-role
 *
 * These headers are injected by the API Gateway.
 */
router.get('/me', getMe);

export default router;