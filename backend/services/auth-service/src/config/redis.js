import { createClient } from 'redis';

let redisClient;

export const connectRedis = async () => {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    
    redisClient.on('error', (err) => console.error('[Redis] Client Error', err));
    
    await redisClient.connect();
    console.log('[Redis] Connected');
  } catch (error) {
    console.error(`[Redis] Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const getRedisClient = () => redisClient;