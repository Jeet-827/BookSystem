import express from 'express';
import {
  uploadBookImage,
  uploadDriveBookFile,
  getDriveConnectUrl,
  checkDriveStatus,
  handleOAuthCallback,
  downloadDriveFile,
} from '../controllers/uploadController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin ImageKit Upload
router.post('/image', protect, adminOnly, uploadBookImage);

// Admin Digital Book File Upload (Google Drive & Cloud CDN Fallback)
router.post('/drive-file', protect, adminOnly, uploadDriveBookFile);
router.post('/file', protect, adminOnly, uploadDriveBookFile);
router.post('/upload', protect, adminOnly, uploadDriveBookFile);

// Status endpoints (supports mounting under /api/admin/drive or /api/admin/upload)
router.get('/status', protect, adminOnly, checkDriveStatus);
router.get('/drive/status', protect, adminOnly, checkDriveStatus);

// Auth URL endpoints (supports mounting under /api/admin/drive or /api/admin/upload)
router.get('/auth-url', protect, adminOnly, getDriveConnectUrl);
router.get('/drive/auth-url', protect, adminOnly, getDriveConnectUrl);

// Google Drive OAuth Callback (public — Google redirects here)
router.get('/callback', handleOAuthCallback);
router.get('/drive/callback', handleOAuthCallback);

// Drive File Download Proxy — requires authentication (C-09 fix)
// Callers must also own a paid order containing this fileId.
router.get('/download/:fileId', protect, downloadDriveFile);
router.get('/drive/download/:fileId', protect, downloadDriveFile);

export default router;
