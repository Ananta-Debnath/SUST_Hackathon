'use strict';

function log(level, message, meta) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta || {}),
  };
  // Single-line JSON keeps logs grep-friendly and avoids breaking log scrapers.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};