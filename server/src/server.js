import { app } from './app.js';
import { config, validateCriticalEnv } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function startServer() {
  logger.info('==================================================');
  logger.info('🚀 Starting Intelligent API Monitoring & Alert Server');
  logger.info(`   Environment : ${config.nodeEnv}`);
  logger.info(`   Port        : ${config.port}`);
  logger.info(`   Threshold   : > ${config.responseTimeThresholdMs}ms`);
  logger.info(`   AI Model    : ${config.groqModel}`);
  logger.info('==================================================');

  // Validate environment variables and display warnings
  const warnings = validateCriticalEnv();
  if (warnings.length > 0) {
    logger.warn('⚠️ Environment Notice:');
    warnings.forEach((w) => logger.warn(`   - ${w}`));
  }

  // Connect to MongoDB Atlas
  await connectDB();

  // Start HTTP listener
  const server = app.listen(config.port, () => {
    logger.info(`✅ HTTP Server listening at http://localhost:${config.port}`);
    logger.info(`👉 Health check: http://localhost:${config.port}/health`);
    logger.info(`👉 API endpoints: http://localhost:${config.port}/monitor and /alerts`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDB();
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Forced exit: Shutdown timed out.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  logger.error(`Fatal server startup error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
