import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startApplicationEventListener } from './events/applicationEventListener.js';
import { startReviewEventListener } from './events/reviewEventListener.js';

const port = Number(process.env.PORT || 4004);

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  await startApplicationEventListener();
  await startReviewEventListener();

  app.listen(port, () => {
    console.log(`[professional-service] listening on port ${port}`);
  });
};

startServer();