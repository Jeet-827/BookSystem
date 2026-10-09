import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookmart';
    const options = {
      maxPoolSize: 20,
      minPoolSize: 2, // Keeps warm connections to avoid TLS re-handshakes
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };
    const db = await mongoose.connect(dbUrl, options);
    logger.info(`Database connected: ${db.connection.host}/${db.connection.name}`);
    return db;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Reconnecting...');
});

export const getDbStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[state] || 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    port: mongoose.connection.port,
  };
};

export default connectDB;
