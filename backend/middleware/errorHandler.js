import logger from '../utils/logger.js';

/**
 * Centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    ip: req.ip,
  });

  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : (isProd ? 'Internal server error' : err.message),
    code: err.code || 'INTERNAL_ERROR',
    ...(isProd ? {} : { stack: err.stack }),
  });
};
