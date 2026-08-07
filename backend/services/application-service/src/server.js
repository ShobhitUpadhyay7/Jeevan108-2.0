import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initStorage } from './config/storage.js';
import { connectRabbitMQ } from './config/rabbitmq.js';

const port = Number(process.env.PORT || 4003);

const startServer = async () => {
  await connectDB();
  await initStorage();
  await connectRabbitMQ();

  app.listen(port, () => {
    console.log(`[application-service] listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start application service:', error);
  process.exit(1);
});