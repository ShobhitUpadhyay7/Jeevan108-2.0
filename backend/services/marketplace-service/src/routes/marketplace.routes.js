import { Router } from 'express';
import { getListings, compareProfessionals, internalQuery } from '../controllers/marketplace.controller.js';

const router = Router();

router.get('/listings', getListings);
router.post('/compare', compareProfessionals);
router.post('/internal/query', internalQuery);

export default router;