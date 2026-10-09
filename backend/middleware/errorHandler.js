import logger from '../utils/logger.js';

/**
 * Centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  
  logger.error(
    `🚨 [API ERROR ${statusCode}] [${req.method}] ${req.originalUrl}\n` +
    `   Message: ${err.message}\n` +
    `   IP: ${req.ip || req.socket?.remoteAddress || 'unknown'}\n` +
    `   Stack: ${err.stack || 'No stack trace'}`
  );

  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : (isProd ? 'Internal server error' : err.message),
    code: err.code || 'INTERNAL_ERROR',
    ...(isProd ? {} : { stack: err.stack }),
  });
};
