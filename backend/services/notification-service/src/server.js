import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startEventConsumer } from './events/eventConsumer.js';

const port = Number(process.env.PORT || 4007);

const startServer = async () => {
    await connectDB();
    await connectRabbitMQ();
    await startEventConsumer();

    app.listen(port, () => {
        console.log(`[notification-service] listening on port ${port}`);
    });
};

startServer();