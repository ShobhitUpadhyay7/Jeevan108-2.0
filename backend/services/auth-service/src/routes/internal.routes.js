import { Router } from 'express';
import { verifyInternalAuth } from '../middleware/internalAuth.middleware.js';
import { authAnalyticsSummary } from '../controllers/internal.controller.js';

const router = Router();
router.use(verifyInternalAuth);
router.get('/analytics-summary', authAnalyticsSummary);
export default router;