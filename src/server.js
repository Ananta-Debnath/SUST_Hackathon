'use strict';

const config = require('./config');
const logger = require('./utils/logger');
const { createApp } = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info('server_listening', {
    port: config.port,
    env: config.nodeEnv,
  });
});

function shutdown(signal) {
  logger.info('shutdown_signal', { signal });
  server.close((err) => {
    if (err) {
      logger.error('shutdown_error', { message: err.message });
      process.exit(1);
    }
    process.exit(0);
  });
  // Force-exit after 5s if connections hang.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;