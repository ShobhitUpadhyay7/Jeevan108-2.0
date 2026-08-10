import { getRedisClient } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Factory for a Redis-backed sliding-window rate limiter middleware.
 */
export const createRateLimiter = ({ windowMs, max, keyGenerator, message }) => {
  return async (req, res, next) => {
    try {
      const redis = getRedisClient();
      if (!redis) return next(); // Redis not ready yet -> fail open

      const key = keyGenerator(req);
      const now = Date.now();

      const result = await redis.slidingWindowRateLimit(key, now, windowMs, max);
      const allowed = result[0] === 1;

      // Standard rate-limit response headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', allowed ? result[1] : 0);

      if (!allowed) {
        const retryAfterSeconds = result[1];
        res.setHeader('Retry-After', retryAfterSeconds);
        // ADD §15: 429 RATE_LIMITED with details.retryAfterSeconds
        return next(
          new ApiError(429, 'RATE_LIMITED', message || 'Rate limit exceeded. Please try again later.', {
            retryAfterSeconds,
          })
        );
      }

      next();
    } catch (error) {
      // FAIL OPEN: a Redis hiccup should not take down the entire API.
      console.error('[RateLimiter] error, failing open:', error.message);
      next();
    }
  };
};

// ---- Key generators ----

const clientIp = (req) =>
  req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

export const ipKey = (scope) => (req) => `ratelimit:${scope}:ip:${clientIp(req)}`;

export const userKey = (scope) => (req) => {
  const userId = req.user?.id || req.headers['x-user-id'] || clientIp(req);
  return `ratelimit:${scope}:user:${userId}`;
};

// ---- Preset limiters (SRD §19, all configurable via env) ----

const envInt = (name, fallback) => parseInt(process.env[name] || fallback, 10);

// Brute-force protection on login/signup (5 / 15 min per IP)
export const authLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
  max: envInt('RATE_LIMIT_AUTH_MAX', 5),
  keyGenerator: ipKey('auth'),
  message: 'Too many authentication attempts. Please try again later.',
});

// Unauthenticated/public traffic (60 / min per IP)
export const publicLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_PUBLIC_WINDOW_MS', 60 * 1000),
  max: envInt('RATE_LIMIT_PUBLIC_MAX', 60),
  keyGenerator: ipKey('public'),
  message: 'Rate limit exceeded. Please try again later.',
});

// Authenticated general API (300 / min per user)
export const generalLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_GLOBAL_WINDOW_MS', 60 * 1000),
  max: envInt('RATE_LIMIT_GLOBAL_MAX', 300),
  keyGenerator: userKey('general'),
  message: 'API rate limit exceeded. Please slow down.',
});

// AI query endpoint (20 / min per user) — protects LLM/vector resources
export const aiLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_AI_WINDOW_MS', 60 * 1000),
  max: envInt('RATE_LIMIT_AI_MAX', 20),
  keyGenerator: userKey('ai'),
  message: 'AI query rate limit exceeded (20/min). Please try again shortly.',
});

// Document uploads (20 / hour per user)
export const uploadLimiter = createRateLimiter({
  windowMs: envInt('RATE_LIMIT_UPLOAD_WINDOW_MS', 60 * 60 * 1000),
  max: envInt('RATE_LIMIT_UPLOAD_MAX', 20),
  keyGenerator: userKey('upload'),
  message: 'Document upload rate limit exceeded (20/hour).',
});