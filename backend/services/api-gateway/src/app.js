import express from "express";
import crypto from "node:crypto";
import { createProxyMiddleware } from "http-proxy-middleware";

import healthRouter from "./routes/health.routes.js";
import { verifyToken, requireRole } from "./middleware/auth.middleware.js"; // <-- NEW
import {
  notFoundMiddleware,
  errorMiddleware,
} from "./middleware/error.middleware.js";

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

// --- ROUTE MOUNTING ---
// MOUNT PROXIES *BEFORE* BODY PARSERS!
// This ensures the proxy can forward the raw body stream to downstream services.

// Public Routes
app.use("/api/v1/auth", authProxy);

// Protected Routes
app.use("/api/v1/users", verifyToken, userProxy);
app.use("/api/v1/applications", verifyToken, applicationProxy);

app.use(express.json({ limit: "1mb" }));

// Example of an Admin-only route (we will just return a mock response for now)
app.get(
  "/api/v1/admin/dashboard",
  verifyToken,
  requireRole("admin"),
  (req, res) => {
    res.json({
      data: { message: "Welcome to the Admin Dashboard" },
      meta: { requestId: req.requestId },
      error: null,
    });
  },
);

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
