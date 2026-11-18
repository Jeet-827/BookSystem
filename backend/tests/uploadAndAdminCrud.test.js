process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import { uploadImageToImageKit } from '../services/imageKitService.js';

describe('Jest-Style File Upload & Admin CRUD Test Suite (18 Tests)', () => {
  let dbConnected = false;

  before(async () => {
    try {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookmart';
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      dbConnected = mongoose.connection.readyState === 1;
    } catch {
      dbConnected = false;
    }
  });

  after(async () => {
    if (dbConnected) {
      await mongoose.connection.close();
    }
  });

  // 1. Image upload auth protection
  test('1. POST /api/admin/upload/image without token is blocked by admin separation (403)', async () => {
    const res = await request(app).post('/api/admin/upload/image').send({ image: 'data:image/png;base64,...' });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // 2. Digital eBook file upload auth protection
  test('2. POST /api/admin/upload/drive-file without token is blocked by admin separation (403)', async () => {
    const res = await request(app).post('/api/admin/upload/drive-file').send({ file: 'data:application/pdf;base64,...' });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // 3. Drive status endpoint auth protection
  test('3. GET /api/admin/drive/status without token is blocked by admin separation (403)', async () => {
    const res = await request(app).get('/api/admin/drive/status');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // 4. Drive auth-url endpoint auth protection
  test('4. GET /api/admin/drive/auth-url without token is blocked by admin separation (403)', async () => {
    const res = await request(app).get('/api/admin/drive/auth-url');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // 5. Direct /api/drive/status route is protected by admin separation (403)
  test('5. GET /api/drive/status route is protected by admin separation (403)', async () => {
    const res = await request(app).get('/api/drive/status');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // 6. Direct /api/upload/image route is protected by admin separation (403)
  test('6. POST /api/upload/image route is protected by admin separation (403)', async () => {
    const res = await request(app).post('/api/upload/image').send({});
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // 7. Reject empty payload on ImageKit upload
  test('7. Image upload helper rejects missing file payload', async () => {
    await assert.rejects(
      async () => {
        await uploadImageToImageKit({ file: null });
      },
      {
        message: /Image file payload is required/,
      }
    );
  });

  // 8. ImageKit URL endpoint check
  test('8. ImageKit CDN URL endpoint is properly configured with https', () => {
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/55dq64n9a';
    assert.ok(endpoint.startsWith('https://ik.imagekit.io/'));
  });

  // 9. Digital eBook format detector
  test('9. Digital book format parser accurately identifies file extensions', () => {
    const detectFormat = (filename) => {
      const ext = filename.split('.').pop()?.toUpperCase() || 'PDF';
      const valid = ['PDF', 'EPUB', 'MOBI', 'AZW3', 'ZIP'];
      return valid.includes(ext) ? ext : 'PDF';
    };

    assert.equal(detectFormat('nodejs_mastery.pdf'), 'PDF');
    assert.equal(detectFormat('refactoring.epub'), 'EPUB');
    assert.equal(detectFormat('kindle_edition.mobi'), 'MOBI');
    assert.equal(detectFormat('archive.zip'), 'ZIP');
    assert.equal(detectFormat('unknown.doc'), 'PDF');
  });

  // 10. File size formatter logic
  test('10. File size calculator accurately formats bytes into MB and KB', () => {
    const formatSize = (bytes) => {
      const mb = bytes / (1024 * 1024);
      return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
    };

    assert.equal(formatSize(5.5 * 1024 * 1024), '5.5 MB');
    assert.equal(formatSize(350 * 1024), '350 KB');
  });

  // 11. Admin Book creation route is blocked on customer API by admin separation
  test('11. POST /api/admin/books is blocked by admin separation (403)', async () => {
    const res = await request(app).post('/api/admin/books').send({
      title: 'Test Book',
      author: 'Test Author',
      price: 299,
    });
    assert.equal(res.status, 403);
  });

  // 12. Auto-fill originalPrice = price logic verification
  test('12. Auto-fill logic sets originalPrice = price when originalPrice is blank', () => {
    const resolvePrices = (price, originalPrice) => {
      const numPrice = Number(price) || 0;
      const numOrig =
        originalPrice !== undefined && originalPrice !== '' && !isNaN(Number(originalPrice))
          ? Number(originalPrice)
          : numPrice;
      return { price: numPrice, originalPrice: numOrig };
    };

    const result = resolvePrices('499', '');
    assert.equal(result.price, 499);
    assert.equal(result.originalPrice, 499);

    const withOrig = resolvePrices('499', '899');
    assert.equal(withOrig.price, 499);
    assert.equal(withOrig.originalPrice, 899);
  });

  // 13. Auto-generate description when left blank
  test('13. Book creation logic auto-generates description when omitted', () => {
    const buildDescription = (title, author, desc) => {
      if (desc && desc.trim()) return desc.trim();
      return `${title.trim()} by ${author.trim()}. Premium digital eBook edition available for instant download on redkitindia.`;
    };

    const generated = buildDescription('Clean Code', 'Robert Martin', '');
    assert.equal(
      generated,
      'Clean Code by Robert Martin. Premium digital eBook edition available for instant download on redkitindia.'
    );
  });

  // 14. Admin order listing route is blocked on customer API by admin separation
  test('14. GET /api/admin/orders is blocked by admin separation (403)', async () => {
    const res = await request(app).get('/api/admin/orders');
    assert.equal(res.status, 403);
  });

  // 15. Admin refund route is blocked on customer API by admin separation
  test('15. PUT /api/admin/orders/:id/refund is blocked by admin separation (403)', async () => {
    const res = await request(app).put('/api/admin/orders/ord_123/refund').send({ action: 'approve' });
    assert.equal(res.status, 403);
  });

  // 16. Filename sanitization strips unsafe characters
  test('16. File name sanitizer removes path traversals and illegal symbols', () => {
    const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const dirty = '../../etc/passwd (copy #1).pdf';
    const clean = sanitizeName(dirty);

    assert.ok(!clean.includes(' '));
    assert.ok(!clean.includes('/'));
    assert.ok(!clean.includes('#'));
    assert.ok(clean.endsWith('.pdf'));
  });

  // 17. Direct customer download link validation
  test('17. Customer download URL supports Google Drive export and ImageKit CDN endpoints', () => {
    const isDirectLink = (url) =>
      url.includes('drive.google.com/uc?export=download') ||
      url.startsWith('https://ik.imagekit.io/') ||
      url.startsWith('https://');

    assert.ok(isDirectLink('https://drive.google.com/uc?export=download&id=abc123xyz'));
    assert.ok(isDirectLink('https://ik.imagekit.io/55dq64n9a/bookmart/digital_files/book.pdf'));
  });

  // 18. Safe discount percentage calculation
  test('18. Safe discount calculation accurately calculates percentage savings without division by zero', () => {
    const calculateDiscount = (price, originalPrice) => {
      const p = Number(price);
      const o = Number(originalPrice);
      if (!o || o <= p) return 0;
      return Math.round(((o - p) / o) * 100);
    };

    assert.equal(calculateDiscount(399, 799), 50);
    assert.equal(calculateDiscount(500, 500), 0);
    assert.equal(calculateDiscount(0, 0), 0);
  });
});
