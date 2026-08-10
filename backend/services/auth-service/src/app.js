import express from 'express';
import crypto from 'node:crypto';
import internalRouter from './routes/internal.routes.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import {
  notFoundMiddleware,
  errorMiddleware
} from './middleware/error.middleware.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'auth-service',
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    },
    error: null
  });
});

app.use('/', authRouter);
app.use('/health', healthRouter);

// INTERNAL routes (HMAC-authenticated, NEVER proxied through public Gateway)
// Internal APIs versioned independently at /internal/v1/...
// Protected by X-Internal-Auth HMAC, not JWT
app.use('/internal/v1/auth', internalRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;