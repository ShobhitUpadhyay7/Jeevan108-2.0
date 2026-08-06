import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT || 4001);
const serviceName = process.env.SERVICE_NAME || 'auth-service';

app.listen(port, () => {
  console.log(`[${serviceName}] listening on port ${port}`);
});