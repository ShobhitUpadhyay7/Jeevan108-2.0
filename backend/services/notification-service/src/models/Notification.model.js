import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true }, // recipient
    
    title: { type: String, required: true },
    body: { type: String, required: true },
    
    category: {
      type: String,
      enum: ['booking', 'application', 'review', 'emergency', 'system'],
      required: true
    },
    
    channel: {
      type: String,
      enum: ['in_app', 'push', 'email', 'sms'],
      default: 'in_app'
    },
    
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Delivery tracking (SRD §2: delivery logs)
    deliveryStatus: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'mocked'],
      default: 'sent'
    },
    deliveredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);