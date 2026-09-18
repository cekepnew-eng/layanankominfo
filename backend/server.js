require('dotenv').config();
const app = require('./src/app');

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Final Architecture Server is running on ${HOST}:${PORT}`);
});
