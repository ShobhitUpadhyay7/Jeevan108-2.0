import crypto from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';

const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;
const CLOCK_SKEW_TOLERANCE_MS = 30_000; // 30 seconds

export const verifyInternalAuth = (req, res, next) => {
    try {
        if (!INTERNAL_SECRET) throw new Error('INTERNAL_SERVICE_SECRET not configured');

        const timestamp = req.headers['x-internal-timestamp'];
        const signature = req.headers['x-internal-auth'];

        if (!timestamp || !signature) {
            throw new ApiError(401, 'UNAUTHENTICATED', 'Missing internal auth headers');
        }

        // Replay protection
        const age = Date.now() - parseInt(timestamp, 10);
        if (Math.abs(age) > CLOCK_SKEW_TOLERANCE_MS) {
            throw new ApiError(401, 'UNAUTHENTICATED', 'Request timestamp outside tolerance');
        }

        // Recompute expected signature
        const payload = `${timestamp}:${req.method}:${req.originalUrl}`;
        const expected = crypto
            .createHmac('sha256', INTERNAL_SECRET)
            .update(payload)
            .digest('hex');

        // Constant-time compare to prevent timing attacks
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid internal signature');
        }

        next();
    } catch (error) {
        next(error);
    }
};