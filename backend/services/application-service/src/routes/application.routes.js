import { Router } from 'express';
import {
  createApplication,
  updateApplication,
  uploadMiddleware,
  uploadDocument,
  submitApplication,
  getApplication,
  makeDecision
} from '../controllers/application.controller.js';

const router = Router();

router.post('/', createApplication);
router.patch('/:applicationId', updateApplication);
router.post('/:applicationId/documents/upload', uploadMiddleware, uploadDocument);
router.post('/:applicationId/submit', submitApplication);
router.get('/:applicationId', getApplication);
router.post('/:applicationId/decision', makeDecision);

export default router;