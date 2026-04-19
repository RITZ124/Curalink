// middleware/logger.js
const logger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${method}\x1b[0m ${originalUrl} ${color}${status}\x1b[0m ${duration}ms`);
  });

  next();
};

// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = { logger, errorHandler };
