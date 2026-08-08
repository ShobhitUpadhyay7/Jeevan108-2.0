import amqp from 'amqplib';
import { ProfessionalCache } from '../models/ProfessionalCache.model.js';

const EXCHANGE_NAME = 'jeevan108_events';

export const startProfessionalEventListener = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        const queueName = 'booking-service-pro-cache-queue';
        const q = await channel.assertQueue(queueName, { durable: true });

        // Bind to both created and updated events
        await channel.bindQueue(q.queue, EXCHANGE_NAME, 'professional.created');
        await channel.bindQueue(q.queue, EXCHANGE_NAME, 'professional.updated');

        console.log('[RabbitMQ] Booking Service listening for professional events...');

        channel.consume(q.queue, async (msg) => {
            if (msg) {
                const event = JSON.parse(msg.content.toString());
                const payload = event.payload;

                // Upsert the local cache
                await ProfessionalCache.findOneAndUpdate(
                    { professionalId: payload.professionalId },
                    {
                        userId: payload.userId,
                        fullName: payload.fullName,
                        roleType: payload.roleType,
                        isActive: payload.isActive,
                        pricing: payload.pricing,
                        lastUpdated: new Date()
                    },
                    { upsert: true, new: true }
                );

                console.log(`[Booking Cache] Synced professional: ${payload.professionalId}`);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('[Booking Event Listener] Error:', error);
    }
};