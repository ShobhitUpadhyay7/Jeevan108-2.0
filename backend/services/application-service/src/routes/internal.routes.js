import { Router } from 'express';
import { verifyInternalAuth } from '../middleware/internalAuth.middleware.js';
import { applicationAnalyticsSummary } from '../controllers/internal.controller.js';

const router = Router();
router.use(verifyInternalAuth);
router.get('/analytics-summary', applicationAnalyticsSummary);
export default router;