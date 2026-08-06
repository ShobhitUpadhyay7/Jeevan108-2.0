import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'auth-service',
      version: 'v1',
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    },
    error: null
  });
});

export default router;