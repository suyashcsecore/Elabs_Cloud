const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` eLabs Student Registration Server running`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Port:        ${config.port}`);
  console.log(` Health:      http://localhost:${config.port}/health`);
  console.log(` API Base:    http://localhost:${config.port}/api`);
  console.log(`=======================================================`);
});

const { pool } = require('./db');
const logger = require('./logger');

// Graceful shutdown handling
const shutdown = async () => {
  logger.info('Received termination signal, shutting down gracefully...');
  server.close(async () => {
    logger.info('Closed out remaining HTTP connections.');
    try {
      if (pool) {
        await pool.end();
        logger.info('Database pool drained successfully.');
      }
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during database pool closure');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
