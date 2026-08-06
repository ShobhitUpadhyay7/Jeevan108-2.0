import 'dotenv/config';
import app from './app.js';
import { connectDB} from './config/db.js';
import { connectRedis } from './config/redis.js';

const port = Number(process.env.PORT || 4001);
const serviceName = process.env.SERVICE_NAME || 'auth-service';

// Connect to MongoDB and Redis
connectDB();
connectRedis();

// Start the server
app.listen(port, () => {
  console.log(`[${serviceName}] listening on port ${port}`);
});