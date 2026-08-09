import { v4 as uuidv4 } from 'uuid';
import { subscribeTo } from '../config/rabbitmq.js';
import { Notification } from '../models/Notification.model.js';
import { renderNotification } from '../templates/notificationTemplates.js';

const QUEUE_NAME = 'notification-service-events';

// All event types we consume (SRD §4.1 Event Catalog)
const SUBSCRIBED_EVENTS = [
  'booking.requested',
  'booking.confirmed',
  'booking.cancelled',
  'application.submitted',
  'application.status_changed',
  'review.submitted',
  'user.registered'
];

export const startEventConsumer = async () => {
  await subscribeTo(SUBSCRIBED_EVENTS, QUEUE_NAME, handleEvent);
};

const handleEvent = async (event) => {
  const { eventType, payload } = event;
  
  const rendered = renderNotification(eventType, payload);
  if (!rendered) return;

  // Determine recipients
  const recipients = getRecipients(eventType, rendered, payload);
  
  // Create notification for each recipient
  for (const recipientId of recipients) {
    const notificationId = `ntf_${uuidv4().slice(0, 8)}`;
    
    await Notification.create({
      notificationId,
      userId: recipientId,
      title: rendered.title,
      body: rendered.body,
      category: rendered.category,
      channel: 'in_app',
      metadata: rendered.metadata,
      deliveryStatus: 'sent',
      deliveredAt: new Date()
    });
    
    console.log(`[Notification] Created ${notificationId} for user ${recipientId} (${eventType})`);
  }
};

/**
 * Determines who should receive the notification.
 * Some events notify a specific user, others notify multiple users.
 */
const getRecipients = (eventType, rendered, payload) => {
  // Special case: booking.cancelled notifies both patient and professional
  if (eventType === 'booking.cancelled') {
    const recipients = [];
    if (payload.patientId) recipients.push(payload.patientId);
    if (payload.professionalUserId) recipients.push(payload.professionalUserId);
    return recipients;
  }
  
  // Special case: application.submitted notifies all staff/admin
  // For MVP, we'll skip this since we don't have a way to query all staff users
  // In production, this would query the Auth Service's internal API
  if (eventType === 'application.submitted') {
    // Skip for MVP - would need internal API call to Auth Service
    console.log('[Notification] Skipping staff notification for MVP');
    return [];
  }
  
  // Default: use the template's getRecipient function
  if (rendered.getRecipient) {
    const recipient = rendered.getRecipient(payload);
    return recipient ? [recipient] : [];
  }
  
  return [];
};