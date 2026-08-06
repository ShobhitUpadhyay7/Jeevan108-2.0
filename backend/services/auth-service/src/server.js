import 'dotenv/config';
import app from './app.js';
import { connectDB} from './config/db.js';
import { connectRedis } from './config/redis.js';
import {connectRabbitMQ} from './config/rabbitmq.js';

const port = Number(process.env.PORT || 4001);
const serviceName = process.env.SERVICE_NAME || 'auth-service';

// Connect to MongoDB , Redis and RabbitMQ
connectDB();
connectRedis();
connectRabbitMQ();

// Start the server
app.listen(port, () => {
  console.log(`[${serviceName}] listening on port ${port}`);
});