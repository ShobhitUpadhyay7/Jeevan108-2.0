import crypto from 'node:crypto';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;
if (!INTERNAL_SECRET) throw new Error('INTERNAL_SERVICE_SECRET env var is required');

export const signInternalRequest = (method, path) => {
  const timestamp = Date.now().toString();
  const payload = `${timestamp}:${method}:${path}`;
  const signature = crypto.createHmac('sha256', INTERNAL_SECRET).update(payload).digest('hex');
  return { timestamp, signature };
};