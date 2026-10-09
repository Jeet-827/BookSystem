import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import compression from 'compression';

import connectDB from './config/db.js';
import cache from './utils/cache.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminBookRoutes from './routes/adminBookRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminSystemRoutes from './routes/adminSystemRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import posterRoutes from './routes/posterRoutes.js';

import Book from './models/Book.js';
import Poster from './models/Poster.js';
import { sampleBooks } from './data/sampleBooks.js';
import { samplePosters } from './data/samplePosters.js';

import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

// Trust proxy for rate limiting and IP detection behind Render / Nginx
app.set('trust proxy', 1);

// Gzip/Brotli compression: Reduces JSON and asset transfer size by ~70-80%
app.use(compression());

// --- Security Middleware ---
app.use(helmet());

// CORS: Allow local dev origins + process.env.CLIENT_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      try {
        const { hostname } = new URL(origin);
        if (
          hostname.endsWith('.vercel.app') ||
          hostname === 'vercel.app' ||
          hostname.endsWith('.onrender.com') ||
          hostname === 'onrender.com'
        ) {
          return callback(null, true);
        }
      } catch {
        if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
          return callback(null, true);
        }
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    maxAge: 86400, // 24hr CORS preflight cache — avoids extra OPTIONS roundtrips on every request
  })
);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// NoSQL Injection & HTTP Parameter Pollution protection
app.use(mongoSanitize());
app.use(hpp());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Customer API Routes with In-Memory Caching (Instant <1ms response times)
app.use('/api/auth', authRoutes);
app.use('/api/books', cache.middleware(60000), bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/posters', cache.middleware(120000), posterRoutes);

// Admin API Routes (Unified on port 5000)
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/books', adminBookRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/system', adminSystemRoutes);
app.use('/api/admin/orders', adminOrderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    server: 'BookMart Unified API (Customer + Admin)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handler
app.use(errorHandler);

const isTesting = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));

let server;

if (!isTesting) {
  connectDB().then(async () => {
    try {
      const bookCount = await Book.countDocuments();
      if (bookCount === 0) {
        await Book.insertMany(sampleBooks);
        logger.info(`Auto-seeded ${sampleBooks.length} sample books.`);
      }
      const posterCount = await Poster.countDocuments();
      if (posterCount === 0) {
        await Poster.insertMany(samplePosters);
        logger.info(`Auto-seeded ${samplePosters.length} sample promotional posters.`);
      }
    } catch (e) {
      logger.warn(`Auto-seeding skipped: ${e.message}`);
    }
  });
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Unified Server running in ${process.env.NODE_ENV || 'development'} mode on http://127.0.0.1:${PORT}`);
  });
}

// Graceful Shutdown for Production Containers & Cloud Services (Render / Docker)
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error(`Error closing MongoDB: ${err.message}`);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default app;
