const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
  console.log(`Health check: http://localhost:${config.PORT}/api/health`);
  console.log(`Test Replicate: http://localhost:${config.PORT}/api/test-replicate`);
});