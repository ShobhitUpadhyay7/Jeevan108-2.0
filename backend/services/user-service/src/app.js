import express from 'express';
import crypto from 'node:crypto';

import healthRouter from './routes/health.routes.js';
import userRouter from './routes/user.routes.js';

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

// health check
app.use('/health', healthRouter);

// User Service routes
app.use('/', userRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;