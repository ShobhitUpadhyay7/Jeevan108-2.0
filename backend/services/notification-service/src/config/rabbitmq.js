import amqp from 'amqplib';

let channel;
const EXCHANGE_NAME = 'jeevan108_events';

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('[RabbitMQ] Connected');
  } catch (error) {
    console.error('[RabbitMQ] Error:', error);
    process.exit(1);
  }
};

export const subscribeTo = async (routingKeys, queueName, handler) => {
  const q = await channel.assertQueue(queueName, { durable: true });
  
  for (const key of routingKeys) {
    await channel.bindQueue(q.queue, EXCHANGE_NAME, key);
  }
  
  console.log(`[RabbitMQ] Subscribed to: ${routingKeys.join(', ')} → ${queueName}`);
  
  channel.consume(q.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      console.log(`[RabbitMQ] Received: ${event.eventType}`);
      await handler(event);
      channel.ack(msg);
    }
  });
};