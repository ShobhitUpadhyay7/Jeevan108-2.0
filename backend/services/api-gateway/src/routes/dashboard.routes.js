import { Router } from 'express';
import { adminDashboard } from '../controllers/dashboard.controller.js';
const router = Router();
router.get('/admin', adminDashboard);
export default router;