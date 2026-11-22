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

import connectDB, { getDbStatus } from './config/db.js';
import cache from './utils/cache.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import posterRoutes from './routes/posterRoutes.js';

import Book from './models/Book.js';
import Admin from './models/Admin.js';
import Poster from './models/Poster.js';
import { sampleBooks } from './data/sampleBooks.js';
import { samplePosters } from './data/samplePosters.js';  // M-08 fix: was missing
import { errorHandler } from './middleware/errorHandler.js';
import querySanitizer from './middleware/querySanitizer.js';
import { seedSampleOrdersIfEmpty } from './data/sampleOrders.js';
import logger from './utils/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// H-06 — Startup environment validation
// Refuse to start in production if critical configuration is missing.
// ─────────────────────────────────────────────────────────────────────────────
const REQUIRED_PROD_ENV = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_PROD_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const app = express();

// Trust proxy for rate limiting and IP detection behind Render / Nginx
app.set('trust proxy', 1);

// Gzip/Brotli compression
app.use(compression());

// ─────────────────────────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'sameorigin' },
    xXssProtection: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// C-06 / H-07 fix — Strict CORS: only explicitly allowed origins.
// No wildcard fallback. *.vercel.app is NOT allowed globally.
// ─────────────────────────────────────────────────────────────────────────────
const buildAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.redkitindia.com',
    'https://redkitindia.com',
  ]);

  // Add explicitly configured production origins
  if (process.env.CLIENT_URL) origins.add(process.env.CLIENT_URL.trim());
  if (process.env.ADMIN_CLIENT_URL) origins.add(process.env.ADMIN_CLIENT_URL.trim());

  // Add any extra comma-separated origins from env
  const extra = process.env.EXTRA_ALLOWED_ORIGINS || '';
  extra.split(',').map((o) => o.trim()).filter(Boolean).forEach((o) => origins.add(o));

  return origins;
};

const ALLOWED_ORIGINS = buildAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / server-to-server calls (no Origin header)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.has(origin)) {
        return callback(null, true);
      }

      try {
        const { hostname } = new URL(origin);
        // Allow redkitindia.com and all subdomains (including www)
        if (hostname === 'redkitindia.com' || hostname.endsWith('.redkitindia.com')) {
          return callback(null, true);
        }
        // In development mode allow localhost on any port
        if (process.env.NODE_ENV !== 'production') {
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return callback(null, true);
          }
        }
      } catch {
        // ignore malformed origin
      }

      return callback(new Error(`CORS: Origin ${origin} is not allowed`));
    },
    credentials: true,
    maxAge: 86400,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// H-02 fix — Sensible body size limits.
// 50 MB was dangerously large for JSON; JSON stays at 1 MB.
// URL-encoded and raw binary is limited to 10 MB for file uploads.
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// NoSQL Injection, Query Sanitization & HTTP Parameter Pollution protection
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(hpp());
app.use(querySanitizer);

// ─────────────────────────────────────────────────────────────────────────────
// M-02 fix — Server-level request timeout (30 seconds)
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(503).json({ success: false, message: 'Request timeout' });
  });
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────────────────────
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

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many token refresh attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many checkout requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/orders', checkoutLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Customer API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/books', cache.middleware(60000), bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/posters', cache.middleware(120000), posterRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Customer API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/books', cache.middleware(60000), bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/posters', cache.middleware(120000), posterRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Strict Separation: Admin operations are hosted exclusively on the dedicated
// Admin Server (Port 5001 / admin-server).
// Direct access to /api/admin, /api/upload, and /api/drive on the customer backend
// is strictly forbidden to protect customer surface and isolate administrative attack vectors.
// ─────────────────────────────────────────────────────────────────────────────
app.use(['/api/admin', '/api/upload', '/api/drive'], (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Admin and upload operations are strictly separated and must be accessed via the dedicated Admin Server on port 5001.',
    adminServerPort: 5001,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BookMart Customer API Server is Live & Running!',
    api: '/api',
    health: '/api/health',
    readiness: '/api/ready',
    adminServer: 'http://127.0.0.1:5001',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M-01 fix — Separate liveness and readiness health checks
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  // Liveness: always returns 200 if process is alive
  res.json({
    success: true,
    status: 'OK',
    server: 'BookMart Customer API (Port 5000)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', (req, res) => {
  // Readiness: reflects actual DB connectivity
  const dbStatus = getDbStatus();
  if (dbStatus.state !== 'connected') {
    return res.status(503).json({
      success: false,
      status: 'NOT_READY',
      reason: `Database is ${dbStatus.state}`,
      timestamp: new Date().toISOString(),
    });
  }
  res.json({
    success: true,
    status: 'READY',
    db: dbStatus.state,
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

// ─────────────────────────────────────────────────────────────────────────────
// Startup — Database connection and conditional seeding
// ─────────────────────────────────────────────────────────────────────────────
const isTesting = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));

let server;

if (!isTesting) {
  connectDB().then(async () => {
    try {
      // Seed books only if collection is empty
      const bookCount = await Book.countDocuments();
      if (bookCount === 0) {
        await Book.insertMany(sampleBooks);
        logger.info(`Auto-seeded ${sampleBooks.length} sample books.`);
      }

      // Seed posters only if collection is empty
      const posterCount = await Poster.countDocuments();
      if (posterCount === 0) {
        await Poster.insertMany(samplePosters);
        logger.info(`Auto-seeded ${samplePosters.length} sample promotional posters.`);
      }

      // ─────────────────────────────────────────────────────────────────────
      // C-04 fix — Bootstrap admin ONLY on first run (no account exists).
      // NEVER reset the password on subsequent startups.
      // Admin credentials must come from env vars; no hardcoded defaults
      // are used in production.
      // ─────────────────────────────────────────────────────────────────────
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
        const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

        if (!adminEmail || !adminPassword) {
          logger.warn(
            'No admin account exists and ADMIN_DEFAULT_EMAIL / ADMIN_DEFAULT_PASSWORD are not set. ' +
            'Set them in .env to bootstrap the first admin account.'
          );
        } else {
          await Admin.create({
            name: 'System Administrator',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isActive: true,
          });
          logger.info(`Bootstrapped initial admin account (${adminEmail}). Remove ADMIN_DEFAULT_PASSWORD from env after first login.`);
        }
      }
      // else: admin(s) already exist — do NOT touch passwords.

      // Seed sample orders for demo stats (only when no orders exist)
      await seedSampleOrdersIfEmpty();
    } catch (e) {
      logger.warn(`Auto-seeding skipped: ${e.message}`);
    }
  });

  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Unified Server running in ${process.env.NODE_ENV || 'development'} mode on http://127.0.0.1:${PORT}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────────────────────
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
