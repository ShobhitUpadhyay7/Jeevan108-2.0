import { Router } from 'express';
import { verifyInternalAuth } from '../middleware/internalAuth.middleware.js';
import { notificationAnalyticsSummary } from '../controllers/internal.controller.js';

const router = Router();
router.use(verifyInternalAuth);
router.get('/analytics-summary', notificationAnalyticsSummary);
export default router;