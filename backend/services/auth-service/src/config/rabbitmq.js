import amqp from 'amqplib';

let channel;
const EXCHANGE_NAME = 'jeevan108_events';

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    // 'topic' exchange allows routing keys like 'user.registered'
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('[RabbitMQ] Connected and exchange asserted');
  } catch (error) {
    console.error('[RabbitMQ] Connection Error:', error);
    process.exit(1);
  }
};

export const publishEvent = async (routingKey, payload) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  
  // Standard event envelope (as per ADD §14)
  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: routingKey,
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
    producer: 'auth-service',
    payload
  };
  
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(event)),
    { persistent: true }
  );
  console.log(`[RabbitMQ] Published event: ${routingKey}`);
};