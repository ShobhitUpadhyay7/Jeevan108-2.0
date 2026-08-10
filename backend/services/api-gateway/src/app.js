import express from "express";
import crypto from "node:crypto";
import { createProxyMiddleware } from "http-proxy-middleware";

import healthRouter from "./routes/health.routes.js";
import { verifyToken, requireRole } from "./middleware/auth.middleware.js"; // <-- NEW
import {
  notFoundMiddleware,
  errorMiddleware,
} from "./middleware/error.middleware.js";

import {
  authLimiter,
  publicLimiter,
  generalLimiter,
  aiLimiter,
  uploadLimiter,
} from './middleware/rateLimiter.js';

import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// --- PROXY CONFIGURATION ---

const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true
});

const userProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true
});

const applicationProxy = createProxyMiddleware({
  target: process.env.APPLICATION_SERVICE_URL,
  changeOrigin: true
});

const professionalProxy = createProxyMiddleware({
  target: process.env.PROFESSIONAL_SERVICE_URL,
  changeOrigin: true
});

const marketplaceProxy = createProxyMiddleware({
  target: process.env.MARKETPLACE_SERVICE_URL,
  changeOrigin: true
});

const bookingProxy = createProxyMiddleware({
  target: process.env.BOOKING_SERVICE_URL,
  changeOrigin: true
});

const notificationProxy = createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true
});

const aiProxy = createProxyMiddleware({
  target: process.env.AI_SERVICE_URL,
  changeOrigin: true
});

// --- ROUTE MOUNTING ---
// MOUNT PROXIES *BEFORE* BODY PARSERS!
// This ensures the proxy can forward the raw body stream to downstream services.

// ---- Auth: strict brute-force protection (5 / 15 min per IP) ----
app.use('/api/v1/auth', authLimiter, authProxy);

// Protected Routes, Then general per-user limit ---- 
app.use("/api/v1/users", verifyToken, generalLimiter, userProxy);
app.use("/api/v1/professionals", verifyToken, generalLimiter, professionalProxy);
app.use("/api/v1/marketplace", verifyToken, generalLimiter, marketplaceProxy);
app.use("/api/v1/bookings", verifyToken, generalLimiter, bookingProxy);
app.use("/api/v1/notifications", verifyToken, generalLimiter, notificationProxy);

// ---- Applications: general limit + stricter upload limit on /documents ----
const uploadAwareLimiter = (req, res, next) => {
  // req.path is relative to the mount point here
  if (req.path.includes('/documents')) {
    return uploadLimiter(req, res, next);
  }
  next();
};

app.use('/api/v1/applications', verifyToken, uploadAwareLimiter, generalLimiter, applicationProxy);

// ---- AI: stricter per-user limit to protect LLM/vector resources ----
app.use('/api/v1/ai', verifyToken, aiLimiter, aiProxy);


app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/dashboard", verifyToken, dashboardRouter);

// Health & Fallback
app.get("/health", (req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
      service: process.env.SERVICE_NAME,
      timestamp: new Date().toISOString(),
    },
    meta: { requestId: req.requestId },
    error: null,
  });
});

app.use("/api/v1/health", healthRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
