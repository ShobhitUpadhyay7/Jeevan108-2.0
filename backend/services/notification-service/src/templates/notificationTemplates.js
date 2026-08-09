/**
 * Notification Templates (PRD FR-7.2)
 * Each template maps an event type to a title/body template with placeholders.
 * Placeholders are filled from the event payload.
 */

const templates = {
  // Booking events
  'booking.requested': {
    category: 'booking',
    title: 'New Booking Request',
    body: 'A patient has requested a {{shiftType}} booking starting {{startAt}}. Please respond within 2 hours.',
    getRecipient: (payload) => payload.professionalUserId,
    metadata: (payload) => ({ bookingId: payload.bookingId, slaExpiresAt: payload.slaExpiresAt })
  },

  'booking.confirmed': {
    category: 'booking',
    title: 'Booking Confirmed! 🎉',
    body: 'Your booking ({{bookingId}}) has been confirmed. The professional will arrive at {{startAt}}.',
    getRecipient: (payload) => payload.patientId,
    metadata: (payload) => ({ bookingId: payload.bookingId, professionalId: payload.professionalId })
  },

  'booking.cancelled': {
    category: 'booking',
    title: 'Booking Cancelled',
    body: 'Your booking ({{bookingId}}) has been cancelled. Reason: {{reason}}',
    getRecipient: null, // Special: notify both patient and professional
    metadata: (payload) => ({ bookingId: payload.bookingId, cancelledBy: payload.cancelledBy })
  },

  // Application events
  'application.submitted': {
    category: 'application',
    title: 'New Professional Application',
    body: 'A new {{roleType}} application ({{applicationId}}) has been submitted and is awaiting review.',
    getRecipient: null, // Special: notify all staff/admin
    metadata: (payload) => ({ applicationId: payload.applicationId, roleType: payload.roleType })
  },

  'application.status_changed': {
    category: 'application',
    title: 'Application Status Updated',
    body: 'Your application ({{applicationId}}) status has changed to {{newStatus}}.',
    getRecipient: (payload) => payload.professionalUserId,
    metadata: (payload) => ({ applicationId: payload.applicationId, newStatus: payload.newStatus, reasonCode: payload.reasonCode })
  },

  // Review events
  'review.submitted': {
    category: 'review',
    title: 'New Review Received ⭐',
    body: 'You received a {{rating}}-star review for booking {{bookingId}}.',
    getRecipient: (payload) => payload.professionalUserId,
    metadata: (payload) => ({ bookingId: payload.bookingId, rating: payload.rating })
  },

  // User events
  'user.registered': {
    category: 'system',
    title: 'Welcome to Jeevan108! 🏥',
    body: 'Thank you for joining Jeevan108. Browse verified healthcare professionals or ask our AI assistant for guidance.',
    getRecipient: (payload) => payload.userId,
    metadata: (payload) => ({ role: payload.role })
  }
};

/**
 * Renders a notification from a template and event payload.
 */
export const renderNotification = (eventType, payload) => {
  const template = templates[eventType];
  if (!template) {
    console.warn(`[Notification] No template found for event: ${eventType}`);
    return null;
  }

  // Simple template interpolation
  const interpolate = (str, data) => {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  };

  return {
    category: template.category,
    title: template.title,
    body: interpolate(template.body, payload),
    getRecipient: template.getRecipient,
    metadata: template.metadata ? template.metadata(payload) : {}
  };
};

export default templates;