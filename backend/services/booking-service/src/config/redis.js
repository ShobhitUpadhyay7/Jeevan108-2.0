import Redis from 'ioredis';

let redis;

export const connectRedis = () => {
  redis = new Redis(process.env.REDIS_URL);
  redis.on('connect', () => console.log('[Redis] Connected'));
  redis.on('error', (err) => console.error('[Redis] Error:', err));
};

export const getRedis = () => redis;