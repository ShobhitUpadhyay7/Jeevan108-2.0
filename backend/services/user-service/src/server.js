import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startConsumer } from './events/consumer.js'; // <-- NEW

const port = Number(process.env.PORT || 4002);
const serviceName = process.env.SERVICE_NAME || 'user-service';

// Connect to MongoDB
connectDB();
// Start the RabbitMQ consumer
startConsumer();

// Start the server
app.listen(port, () => {
  console.log(`[${serviceName}] listening on port ${port}`);
});