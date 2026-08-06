import amqp from 'amqplib';
import { UserProfile } from '../models/UserProfile.model.js';

const EXCHANGE_NAME = 'jeevan108_events';

export const startConsumer = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    // Create a queue specifically for the User Service
    const queueName = 'user-service-queue';
    const q = await channel.assertQueue(queueName, { durable: true });
    
    // Bind to 'user.registered' events
    await channel.bindQueue(q.queue, EXCHANGE_NAME, 'user.registered');
    
    console.log('[RabbitMQ Consumer] Waiting for user.registered events...');
    
    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ] Received: ${event.eventType}`);
        
        if (event.eventType === 'user.registered') {
          await handleUserRegistered(event.payload);
        }
        
        // Acknowledge message so it is removed from queue
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('[RabbitMQ Consumer] Error:', error);
  }
};

const handleUserRegistered = async (payload) => {
  try {
    const { userId, fullName } = payload;
    
    // Idempotency check
    const existing = await UserProfile.findOne({ userId });
    if (existing) return;
    
    await UserProfile.create({ userId, fullName });
    console.log(`[User Profile] Created profile for userId: ${userId}`);
  } catch (error) {
    console.error('[User Profile] Error creating profile:', error);
  }
};