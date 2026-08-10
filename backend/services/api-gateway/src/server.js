import 'dotenv/config';
import app from './app.js';
import { connectRedis } from './config/redis.js';

const port = Number(process.env.PORT || 4000);
const serviceName = process.env.SERVICE_NAME || 'api-gateway';


async function startServer() {
  connectRedis();

  app.listen(port, () => {
    console.log(`[${serviceName}] listening on port ${port}`);
  });
}

startServer();