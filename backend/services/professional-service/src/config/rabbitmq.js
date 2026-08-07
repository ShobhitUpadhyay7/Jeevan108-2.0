import amqp from 'amqplib';

let channel, connection;
const EXCHANGE_NAME = 'jeevan108_events';

export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('[RabbitMQ] Connected');
  } catch (error) {
    console.error('[RabbitMQ] Error:', error);
    process.exit(1);
  }
};

export const publishEvent = async (routingKey, payload) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: routingKey,
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
    producer: 'professional-service',
    payload
  };
  channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(event)), { persistent: true });
  console.log(`[RabbitMQ] Published: ${routingKey}`);
};

export const subscribeTo = async (routingKey, queueName, handler) => {
  const q = await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      console.log(`[RabbitMQ] Received: ${event.eventType}`);
      await handler(event);
      channel.ack(msg);
    }
  });
  console.log(`[RabbitMQ] Subscribed to: ${routingKey} → ${queueName}`);
};