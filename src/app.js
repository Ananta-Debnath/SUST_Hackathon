'use strict';

const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const sortTicketRouter = require('./routes/sortTicket');

function createApp() {
  const app = express();

  // Trust Render's proxy so future rate-limit / IP-aware middleware would work.
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '32kb' }));
  app.use(requestLogger);

  app.use(healthRouter);
  app.use(sortTicketRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };