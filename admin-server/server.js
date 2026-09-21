import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminBookRoutes from './routes/adminBookRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminSystemRoutes from './routes/adminSystemRoutes.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

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
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

const isRunningTests = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));

if (!isRunningTests) {
  connectDB();
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`BookMart ADMIN Server running on http://127.0.0.1:${PORT}`);
  });
}

export default app;
