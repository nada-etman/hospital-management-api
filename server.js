require('./src/config/env');
const app = require('./src/app');
const logger = require('./src/config/logger');
const { port } = require('./src/config/env');

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`API docs available at http://localhost:${port}/api-docs`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});
