const isProduction = process.env.NODE_ENV === 'production';

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.log(formatMessage('info', message), ...args);
  },
  warn: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('warn', message), ...args);
  },
  error: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.error(formatMessage('error', message), ...args);
  },
  debug: (message, ...args) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message), ...args);
    }
  },
};

export default logger;
