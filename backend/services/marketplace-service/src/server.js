import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startProfessionalEventListener } from './events/professionalEventListener.js';

const port = Number(process.env.PORT || 4005);

const startServer = async () => {
  await connectDB();
  connectRedis();
  await connectRabbitMQ();
  await startProfessionalEventListener();

  app.listen(port, () => {
    console.log(`[marketplace-service] listening on port ${port}`);
  });
};

startServer();