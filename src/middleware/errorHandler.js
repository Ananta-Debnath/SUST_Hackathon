'use strict';

const logger = require('../utils/logger');

// 404 handler — keep the JSON shape uniform with error responses.
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `No route for ${req.method} ${req.path}`,
  });
}

// Centralized error handler. Hides stack traces from the client while
// keeping them in server logs for debugging.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  logger.error('unhandled_error', {
    method: req.method,
    path: req.path,
    status,
    message: err.message,
  });
  res.status(status).json({
    error: err.code || 'internal_error',
    message: status >= 500 ? 'Internal server error' : err.message,
  });
}

module.exports = { notFoundHandler, errorHandler };