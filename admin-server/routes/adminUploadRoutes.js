import express from 'express';
import {
  uploadBookImage,
  uploadDriveBookFile,
  getDriveConnectUrl,
  checkDriveStatus,
  handleOAuthCallback,
  downloadDriveFile,
} from '../controllers/adminUploadController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin ImageKit Upload
router.post('/image', protectAdmin, uploadBookImage);

// Admin Digital Book File Upload (Google Drive & Cloud CDN Fallback)
router.post('/drive-file', protectAdmin, uploadDriveBookFile);
router.post('/file', protectAdmin, uploadDriveBookFile);
router.post('/upload', protectAdmin, uploadDriveBookFile);

// Status endpoints (supports mounting under /api/admin/drive or /api/admin/upload)
router.get('/status', protectAdmin, checkDriveStatus);
router.get('/drive/status', protectAdmin, checkDriveStatus);

// Auth URL endpoints (supports mounting under /api/admin/drive or /api/admin/upload)
router.get('/auth-url', protectAdmin, getDriveConnectUrl);
router.get('/drive/auth-url', protectAdmin, getDriveConnectUrl);

// Public Google Drive OAuth Callback & Download Proxy
router.get('/callback', handleOAuthCallback);
router.get('/drive/callback', handleOAuthCallback);
router.get('/download/:fileId', downloadDriveFile);
router.get('/drive/download/:fileId', downloadDriveFile);

export default router;
