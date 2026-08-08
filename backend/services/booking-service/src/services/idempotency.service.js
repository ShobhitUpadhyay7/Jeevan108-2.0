import { getRedis } from '../config/redis.js';

const IDEMPOTENCY_TTL = 86400; // 24 hours

/**
 * Checks if an idempotency key has already been used.
 * Returns the cached response if it exists, null otherwise.
 */
export const checkIdempotencyKey = async (key) => {
  const redis = getRedis();
  const cached = await redis.get(`idempotency:${key}`);
  return cached ? JSON.parse(cached) : null;
};

/**
 * Stores the response for an idempotency key.
 */
export const storeIdempotencyKey = async (key, response) => {
  const redis = getRedis();
  await redis.set(
    `idempotency:${key}`,
    JSON.stringify(response),
    'EX',
    IDEMPOTENCY_TTL
  );
};