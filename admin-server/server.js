import 'dotenv/config'; // Must be first — loads .env before other modules
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import connectDB from './config/db.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminBookRoutes from './routes/adminBookRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminSystemRoutes from './routes/adminSystemRoutes.js';
import logger from './utils/logger.js';

const app = express();

// --- Security Middleware ---

// Helmet: Sets secure HTTP headers (XSS protection, clickjacking prevention, etc.)
app.use(helmet());

// CORS: Only allow known origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent large payload attacks
app.use(express.urlencoded({ extended: false }));

// NoSQL Injection Prevention: Strips $ and . from req.body, req.query, req.params
app.use(mongoSanitize());

// HTTP Parameter Pollution: Prevents duplicate query params
app.use(hpp());

// Rate Limiting: Prevent brute-force and DDoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window per IP
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for admin auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window per IP (stricter for admin)
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/admin/auth/login', authLimiter);
app.use('/api/admin/auth/register-admin', authLimiter);

// Cookie Parser Middleware with native fallback
app.use((req, res, next) => {
  req.cookies = req.cookies || {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach((c) => {
      const idx = c.indexOf('=');
      if (idx !== -1) {
        const key = c.substring(0, idx).trim();
        const val = c.substring(idx + 1).trim();
        req.cookies[key] = decodeURIComponent(val);
      }
    });
  }
  next();
});

// Admin API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/books', adminBookRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/system', adminSystemRoutes);

// Health Check Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'BookMart Admin Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/admin/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'BookMart Admin Service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Admin API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Admin Server Error: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Admin Server error',
  });
});

const isTesting = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));

if (!isTesting) {
  connectDB();
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`BookMart ADMIN Server running on http://127.0.0.1:${PORT}`);
  });
}

export default app;
