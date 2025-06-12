// backend/src/utils/logger.js
function timestamp() {
  return new Date().toISOString();
}

function log(level, message, meta = {}) {
  const entry = {
    timestamp: timestamp(),
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
