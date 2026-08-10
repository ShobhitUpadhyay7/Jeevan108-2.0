import axios from 'axios';
import { signInternalRequest } from '../middleware/internalAuth.js';
import { ApiError } from '../utils/ApiError.js';

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL,
  booking: process.env.BOOKING_SERVICE_URL,
  application: process.env.APPLICATION_SERVICE_URL,
  notification: process.env.NOTIFICATION_SERVICE_URL,
};

const callInternal = async (serviceKey, path) => {
  const baseUrl = SERVICES[serviceKey];
  if (!baseUrl) return { _error: `${serviceKey} URL not configured` };
  try {
    const { timestamp, signature } = signInternalRequest('GET', path);
    const response = await axios.get(`${baseUrl}${path}`, {
      headers: { 'X-Internal-Auth': signature, 'X-Internal-Timestamp': timestamp },
      timeout: 6000,
    });
    return response.data.data || {};
  } catch (error) {
    console.error(`[BFF] ${serviceKey}${path} failed:`, error.message);
    return { _error: `${serviceKey} unavailable` };
  }
};

export const adminDashboard = async (req, res, next) => {
  try {
    if (!['staff', 'admin'].includes(req.user?.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Only staff/admin can access admin dashboard');
    }
    const [authData, bookingData, appData, notifData] = await Promise.all([
      callInternal('auth', '/internal/v1/auth/analytics-summary'),
      callInternal('booking', '/internal/v1/bookings/analytics-summary'),
      callInternal('application', '/internal/v1/applications/analytics-summary'),
      callInternal('notification', '/internal/v1/notifications/analytics-summary'),
    ]);
    res.status(200).json({ data: { ...authData, ...bookingData, ...appData, ...notifData }, meta: { requestId: req.requestId }, error: null });
  } catch (error) { next(error); }
};