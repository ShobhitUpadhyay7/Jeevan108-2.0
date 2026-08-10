/**
 * Jeevan108 API Client & Endpoint Registry
 * 
 * Comprehensive API client exposing all backend endpoints across services:
 * - Auth Service (/api/v1/auth)
 * - User Service (/api/v1/users)
 * - Professional Service (/api/v1/professionals)
 * - Marketplace Service (/api/v1/marketplace)
 * - Booking Service (/api/v1/bookings)
 * - Notification Service (/api/v1/notifications)
 * - Application Service (/api/v1/applications)
 * - AI Service (/api/v1/ai)
 * - Admin & System Health (/api/v1/admin, /health)
 */

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Complete Catalogue of Backend Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: { method: 'POST', path: '/api/v1/auth/signup', description: 'Register a new user account' },
    LOGIN: { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate user with email/phone & password' },
    REFRESH: { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh access token using refresh token' },
    LOGOUT: { method: 'POST', path: '/api/v1/auth/logout', description: 'Logout user and revoke current refresh token' },
    LOGOUT_ALL: { method: 'POST', path: '/api/v1/auth/logout-all', description: 'Revoke all active sessions for current user' },
  },
  USER: {
    GET_ME: { method: 'GET', path: '/api/v1/users/me', description: 'Fetch authenticated user profile details' },
  },
  PROFESSIONAL: {
    GET_PUBLIC_PROFILE: { method: 'GET', path: '/api/v1/professionals/:id', description: 'Get public professional profile by ID' },
    GET_MY_PROFILE: { method: 'GET', path: '/api/v1/professionals/me', description: 'Get authenticated professional own profile' },
    UPDATE_MY_PROFILE: { method: 'PATCH', path: '/api/v1/professionals/me', description: 'Update authenticated professional profile' },
    GET_AVAILABILITY: { method: 'GET', path: '/api/v1/professionals/me/availability', description: 'Get professional availability schedule' },
    UPDATE_AVAILABILITY: { method: 'PUT', path: '/api/v1/professionals/me/availability', description: 'Update availability schedule and set active status' },
    CREATE_INTERNAL: { method: 'POST', path: '/api/v1/professionals/internal/create', description: 'Internal service endpoint to create professional record' },
  },
  MARKETPLACE: {
    GET_LISTINGS: { method: 'GET', path: '/api/v1/marketplace/listings', description: 'Search and filter active healthcare professional listings' },
    COMPARE: { method: 'POST', path: '/api/v1/marketplace/compare', description: 'Compare 2-3 professional profiles side by side' },
    INTERNAL_QUERY: { method: 'POST', path: '/api/v1/marketplace/internal/query', description: 'Internal query endpoint for AI assistant matching' },
  },
  BOOKING: {
    CREATE: { method: 'POST', path: '/api/v1/bookings', description: 'Create a new care booking request (requires Idempotency-Key)' },
    GET_LIST: { method: 'GET', path: '/api/v1/bookings', description: 'List bookings with status/date filters' },
    GET_DETAILS: { method: 'GET', path: '/api/v1/bookings/:bookingId', description: 'Fetch specific booking details by booking ID' },
    RESPOND: { method: 'POST', path: '/api/v1/bookings/:bookingId/respond', description: 'Professional accept or decline booking request' },
    CANCEL: { method: 'POST', path: '/api/v1/bookings/:bookingId/cancel', description: 'Cancel an existing booking' },
    COMPLETE: { method: 'POST', path: '/api/v1/bookings/:bookingId/complete', description: 'Mark a booking as completed' },
    REVIEW: { method: 'POST', path: '/api/v1/bookings/:bookingId/review', description: 'Submit review and rating for completed booking' },
  },
  NOTIFICATION: {
    GET_LIST: { method: 'GET', path: '/api/v1/notifications', description: 'Get user notifications with unread count' },
    MARK_READ: { method: 'PATCH', path: '/api/v1/notifications/:id/read', description: 'Mark single notification as read' },
    MARK_ALL_READ: { method: 'PATCH', path: '/api/v1/notifications/read-all', description: 'Mark all notifications as read' },
  },
  APPLICATION: {
    CREATE_DRAFT: { method: 'POST', path: '/api/v1/applications', description: 'Start a new professional application draft' },
    UPDATE_STEP: { method: 'PATCH', path: '/api/v1/applications/:applicationId', description: 'Autosave application section data' },
    UPLOAD_DOC: { method: 'POST', path: '/api/v1/applications/:applicationId/documents/upload', description: 'Upload document file (ID, certificate, photo)' },
    SUBMIT: { method: 'POST', path: '/api/v1/applications/:applicationId/submit', description: 'Submit application for staff review' },
    GET_DETAILS: { method: 'GET', path: '/api/v1/applications/:applicationId', description: 'Get application details and status' },
    DECISION: { method: 'POST', path: '/api/v1/applications/:applicationId/decision', description: 'Staff decision (approve, reject, request info)' },
  },
  AI: {
    QUERY: { method: 'POST', path: '/api/v1/ai/query', description: 'Send query to AI Knowledge RAG Assistant' },
    QUERY_STREAM: { method: 'POST', path: '/api/v1/ai/query/stream', description: 'Stream AI Knowledge Assistant response token-by-token' },
  },
  ADMIN: {
    DASHBOARD: { method: 'GET', path: '/api/v1/admin/dashboard', description: 'Access Admin Dashboard metrics (Admin role required)' },
  },
  HEALTH: {
    GATEWAY: { method: 'GET', path: '/health', description: 'API Gateway health status' },
    API_V1_HEALTH: { method: 'GET', path: '/api/v1/health', description: 'Detailed health check breakdown' },
  }
};

/**
 * Token management helpers
 */
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (token) => localStorage.setItem('accessToken', token);
export const removeToken = () => localStorage.removeItem('accessToken');

export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token) => localStorage.setItem('refreshToken', token);
export const removeRefreshToken = () => localStorage.removeItem('refreshToken');

/**
 * Base HTTP request handler
 */
async function request(endpoint, options = {}) {
  const { pathParams, query, body, headers = {}, isFormData = false, idempotencyKey } = options;

  let url = `${API_BASE_URL}${endpoint.path}`;

  // Replace URL parameters (e.g. :bookingId -> bk_123)
  if (pathParams) {
    Object.keys(pathParams).forEach((key) => {
      url = url.replace(`:${key}`, encodeURIComponent(pathParams[key]));
    });
  }

  // Build query string
  if (query) {
    const searchParams = new URLSearchParams();
    Object.keys(query).forEach((key) => {
      if (query[key] !== undefined && query[key] !== null) {
        searchParams.append(key, query[key]);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Set default headers
  const reqHeaders = { ...headers };
  const token = getToken();
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    reqHeaders['Idempotency-Key'] = idempotencyKey;
  }

  if (!isFormData && body && typeof body === 'object' && !(body instanceof FormData)) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    method: endpoint.method,
    headers: reqHeaders,
  };

  if (body) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const json = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        code: json.error?.code || 'API_ERROR',
        message: json.error?.message || response.statusText,
        details: json.error?.details || null,
      };
    }

    return json;
  } catch (err) {
    if (err.status) throw err;
    throw {
      status: 500,
      code: 'NETWORK_ERROR',
      message: err.message || 'Network request failed',
      details: null,
    };
  }
}

// ==========================================
// SERVICE CLIENT MODULES
// ==========================================

/** 1. Auth Service API */
export const authApi = {
  signup: (data) => request(API_ENDPOINTS.AUTH.SIGNUP, { body: data }),
  login: (data) => request(API_ENDPOINTS.AUTH.LOGIN, { body: data }),
  refresh: (refreshToken) => request(API_ENDPOINTS.AUTH.REFRESH, { body: { refreshToken } }),
  logout: (refreshToken) => request(API_ENDPOINTS.AUTH.LOGOUT, { body: { refreshToken } }),
  logoutAll: () => request(API_ENDPOINTS.AUTH.LOGOUT_ALL),
};

/** 2. User Service API */
export const userApi = {
  getMe: () => request(API_ENDPOINTS.USER.GET_ME),
};

/** 3. Professional Service API */
export const professionalApi = {
  getPublicProfile: (id) => request(API_ENDPOINTS.PROFESSIONAL.GET_PUBLIC_PROFILE, { pathParams: { id } }),
  getMyProfile: () => request(API_ENDPOINTS.PROFESSIONAL.GET_MY_PROFILE),
  updateMyProfile: (data) => request(API_ENDPOINTS.PROFESSIONAL.UPDATE_MY_PROFILE, { body: data }),
  getAvailability: () => request(API_ENDPOINTS.PROFESSIONAL.GET_AVAILABILITY),
  updateAvailability: (data) => request(API_ENDPOINTS.PROFESSIONAL.UPDATE_AVAILABILITY, { body: data }),
  createInternal: (data) => request(API_ENDPOINTS.PROFESSIONAL.CREATE_INTERNAL, { body: data }),
};

/** 4. Marketplace Service API */
export const marketplaceApi = {
  getListings: (query = {}) => request(API_ENDPOINTS.MARKETPLACE.GET_LISTINGS, { query }),
  compareProfessionals: (professionalIds) => request(API_ENDPOINTS.MARKETPLACE.COMPARE, { body: { professionalIds } }),
  internalQuery: (data) => request(API_ENDPOINTS.MARKETPLACE.INTERNAL_QUERY, { body: data }),
};

/** 5. Booking Service API */
export const bookingApi = {
  createBooking: (data, idempotencyKey = crypto.randomUUID()) =>
    request(API_ENDPOINTS.BOOKING.CREATE, { body: data, idempotencyKey }),
  getBookings: (query = {}) => request(API_ENDPOINTS.BOOKING.GET_LIST, { query }),
  getBooking: (bookingId) => request(API_ENDPOINTS.BOOKING.GET_DETAILS, { pathParams: { bookingId } }),
  respondToBooking: (bookingId, action, reason) =>
    request(API_ENDPOINTS.BOOKING.RESPOND, { pathParams: { bookingId }, body: { action, reason } }),
  cancelBooking: (bookingId, reason) =>
    request(API_ENDPOINTS.BOOKING.CANCEL, { pathParams: { bookingId }, body: { reason } }),
  completeBooking: (bookingId) =>
    request(API_ENDPOINTS.BOOKING.COMPLETE, { pathParams: { bookingId } }),
  reviewBooking: (bookingId, rating, comment) =>
    request(API_ENDPOINTS.BOOKING.REVIEW, { pathParams: { bookingId }, body: { rating, comment } }),
};

/** 6. Notification Service API */
export const notificationApi = {
  getNotifications: (query = {}) => request(API_ENDPOINTS.NOTIFICATION.GET_LIST, { query }),
  markAsRead: (id) => request(API_ENDPOINTS.NOTIFICATION.MARK_READ, { pathParams: { id } }),
  markAllAsRead: () => request(API_ENDPOINTS.NOTIFICATION.MARK_ALL_READ),
};

/** 7. Application Service API */
export const applicationApi = {
  createDraft: () => request(API_ENDPOINTS.APPLICATION.CREATE_DRAFT),
  updateStep: (applicationId, step, data) =>
    request(API_ENDPOINTS.APPLICATION.UPDATE_STEP, { pathParams: { applicationId }, body: { step, data } }),
  uploadDocument: (applicationId, file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return request(API_ENDPOINTS.APPLICATION.UPLOAD_DOC, {
      pathParams: { applicationId },
      body: formData,
      isFormData: true,
    });
  },
  submitApplication: (applicationId) =>
    request(API_ENDPOINTS.APPLICATION.SUBMIT, { pathParams: { applicationId } }),
  getApplication: (applicationId) =>
    request(API_ENDPOINTS.APPLICATION.GET_DETAILS, { pathParams: { applicationId } }),
  makeDecision: (applicationId, decision, reasonCode, notes) =>
    request(API_ENDPOINTS.APPLICATION.DECISION, {
      pathParams: { applicationId },
      body: { decision, reasonCode, notes },
    }),
};

/** 8. AI Service API */
export const aiApi = {
  query: (text, sessionId) => request(API_ENDPOINTS.AI.QUERY, { body: { text, sessionId } }),
  queryStream: async (text, sessionId, onChunk, onError) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AI.QUERY_STREAM.path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, sessionId }),
      });

      if (!response.ok) {
        throw new Error(`AI Stream HTTP Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (onChunk) onChunk(data);
            } catch (err) {
              console.error('Failed to parse SSE event data', err);
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
      else throw err;
    }
  },
};

/** 9. Admin & Health Check API */
export const adminApi = {
  getDashboard: () => request(API_ENDPOINTS.ADMIN.DASHBOARD),
};

export const healthApi = {
  getGatewayHealth: () => request(API_ENDPOINTS.HEALTH.GATEWAY),
  getV1Health: () => request(API_ENDPOINTS.HEALTH.API_V1_HEALTH),
};

/**
 * Default API Object
 */
const api = {
  endpoints: API_ENDPOINTS,
  baseUrl: API_BASE_URL,
  auth: authApi,
  user: userApi,
  professional: professionalApi,
  marketplace: marketplaceApi,
  booking: bookingApi,
  notification: notificationApi,
  application: applicationApi,
  ai: aiApi,
  admin: adminApi,
  health: healthApi,
  tokens: {
    getToken,
    setToken,
    removeToken,
    getRefreshToken,
    setRefreshToken,
    removeRefreshToken,
  },
};

export default api;
