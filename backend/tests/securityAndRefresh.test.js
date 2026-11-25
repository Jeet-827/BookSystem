process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import { sanitizeValue } from '../middleware/querySanitizer.js';

describe('Jest-Style Security, Refresh Token, Helmet & Search Tests (18 Tests)', () => {
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

  test('1. POST /api/auth/refresh without token returns 401 Unauthorized', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('No refresh token'));
  });

  test('2. POST /api/auth/refresh with bogus token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'bogus.invalid.jwt_token' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('3. Helmet X-Content-Type-Options: nosniff header is set on all API responses', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  test('4. Helmet X-Frame-Options: SAMEORIGIN header is set to prevent clickjacking', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  });

  test('5. Helmet Cross-Origin-Resource-Policy header is set', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.headers['cross-origin-resource-policy'], 'cross-origin');
  });

  test('6. Rate limiting standard headers are returned on token refresh route', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    assert.ok(res.headers['ratelimit-limit'] || res.headers['x-ratelimit-limit']);
  });

  test('7. Query sanitizer strips $where NoSQL injection from inputs', () => {
    const malicious = { search: 'Atomic', $where: 'sleep(1000)' };
    const clean = sanitizeValue(malicious);
    assert.equal(clean.search, 'Atomic');
    assert.equal(clean.$where, undefined);
  });

  test('8. Query sanitizer strips $gt injection in authentication payloads', () => {
    const malicious = { email: 'admin@bookmart.com', password: { $gt: '' } };
    const clean = sanitizeValue(malicious);
    assert.equal(clean.password.$gt, undefined);
  });

  test('9. Query sanitizer neutralizes prototype pollution attempts (__proto__)', () => {
    const malicious = JSON.parse('{"__proto__": {"isAdmin": true}, "title": "Gatsby"}');
    const clean = sanitizeValue(malicious);
    assert.equal(clean.title, 'Gatsby');
    assert.equal(Object.prototype.isAdmin, undefined);
  });

  test('10. Query sanitizer preserves clean strings, numbers, and booleans', () => {
    const cleanInput = { category: 'Technology', minPrice: 200, inStock: true };
    const clean = sanitizeValue(cleanInput);
    assert.deepEqual(clean, cleanInput);
  });

  test('11. GET /api/books/preview?q= returns empty list when query is empty', async () => {
    const res = await request(app).get('/api/books/preview?q=');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 0);
    assert.deepEqual(res.body.results, []);
  });

  test('12. GET /api/books/preview with special regex characters escapes safely', async (t) => {
    if (!dbConnected) {
      t.skip('Skipping DB-dependent preview search test: MongoDB not reachable');
      return;
    }
    const res = await request(app).get('/api/books/preview?q=' + encodeURIComponent('.*+?^${}()|[]\\'));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 0);
  });

  test('13. POST /api/orders/razorpay/create-order without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/orders/razorpay/create-order')
      .send({ amount: 500 });
    assert.equal(res.status, 401);
  });

  test('14. POST /api/auth/register rejects dummy email domains like test.com', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Tester',
      email: 'john@test.com',
      password: 'Password123!',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('test') || res.body.message.includes('dummy') || res.body.message.includes('genuine'));
  });

  test('15. POST /api/auth/register rejects disposable mailinator domains', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Disposable User',
      email: 'user@mailinator.com',
      password: 'Password123!',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('16. Sanitizer cleanly trims leading and trailing whitespaces from strings', () => {
    const input = { q: '   James Clear   ' };
    const clean = sanitizeValue(input);
    assert.equal(clean.q, 'James Clear');
  });

  test('17. Sanitizer handles nested arrays of objects without mutating structure', () => {
    const input = {
      books: [{ title: 'Book 1' }, { title: 'Book 2', $gt: '' }],
    };
    const clean = sanitizeValue(input);
    assert.equal(clean.books.length, 2);
    assert.equal(clean.books[1].$gt, undefined);
  });

  test('18. GET /api/admin/dashboard/stats is rejected on customer backend by strict separation (403)', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats');
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
});
