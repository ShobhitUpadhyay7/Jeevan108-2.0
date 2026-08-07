import express from 'express';
import crypto from 'node:crypto';
import applicationRouter from './routes/application.routes.js';
import { notFoundMiddleware, errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    data: { status: 'ok', service: 'application-service', timestamp: new Date().toISOString() },
    meta: { requestId: req.requestId },
    error: null
  });
});

app.use('/', applicationRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;