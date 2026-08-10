import Redis from 'ioredis';

// Atomic sliding-window rate limit.
// Each request is stored as a sorted-set member scored by its timestamp (ms).
// On every request we: prune entries outside the window, count what remains,
// then either admit (add the new entry) or reject with a retry-after hint.
const SLIDING_WINDOW_SCRIPT = `
local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])

-- Drop requests that have fallen out of the window
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

local count = redis.call('ZCARD', key)

if count < limit then
  -- Admit: record this request (unique member = timestamp + random suffix)
  redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
  redis.call('PEXPIRE', key, window)
  return {1, limit - count - 1}          -- {allowed, remaining}
else
  -- Reject: figure out when the oldest request leaves the window
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfter = math.ceil(window / 1000)
  if oldest and oldest[2] then
    retryAfter = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
    if retryAfter < 1 then retryAfter = 1 end
  end
  return {0, retryAfter}                 -- {denied, retryAfterSeconds}
end
`;

let redis;

export const connectRedis = () => {
  redis = new Redis(process.env.REDIS_URL);

  // Register the Lua script as a named command. ioredis uses EVALSHA under
  // the hood, so the script body is shipped once — not on every request.
  redis.defineCommand('slidingWindowRateLimit', {
    numberOfKeys: 1,
    lua: SLIDING_WINDOW_SCRIPT,
  });

  redis.on('connect', () => console.log('[Redis] Gateway connected'));
  redis.on('error', (err) => console.error('[Redis] Gateway error:', err.message));
};

export const getRedisClient = () => redis;