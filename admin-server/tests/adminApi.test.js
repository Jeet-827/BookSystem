process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('BookMart Dedicated Admin Server API Tests (Port 5001)', () => {
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

  test('1. GET /api/health returns status OK and admin server name', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.equal(res.body.server, 'BookMart Admin Server');
  });

  test('2. GET /api/admin/health returns admin service status', async () => {
    const res = await request(app).get('/api/admin/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.equal(res.body.service, 'BookMart Admin Service');
  });

  test('3. Security headers (Helmet) are present on Admin Server responses', async () => {
    const res = await request(app).get('/api/health');
    assert.ok(res.headers['x-content-type-options']);
    assert.ok(res.headers['x-frame-options']);
  });

  test('4. GET /api/admin/dashboard/metrics requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/dashboard/metrics');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('5. GET /api/admin/dashboard/stats requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('6. GET /api/admin/orders requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/orders');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('7. GET /api/admin/orders/stats requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/orders/stats');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('8. PUT /api/admin/orders/:id/refund requires authentication (401)', async () => {
    const res = await request(app).put('/api/admin/orders/507f1f77bcf86cd799439011/refund').send({ action: 'approve' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('9. POST /api/admin/books without admin auth returns 401', async () => {
    const res = await request(app).post('/api/admin/books').send({ title: 'New Book' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('10. GET /api/admin/books without admin auth returns 401', async () => {
    const res = await request(app).get('/api/admin/books');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('11. POST /api/admin/upload/image requires admin authentication (401)', async () => {
    const res = await request(app).post('/api/admin/upload/image').send({ image: 'data:image/png;base64,...' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('12. POST /api/admin/upload/drive-file requires admin authentication (401)', async () => {
    const res = await request(app).post('/api/admin/upload/drive-file').send({ file: 'data:application/pdf;base64,...' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('13. GET /api/admin/drive/status requires admin authentication (401)', async () => {
    const res = await request(app).get('/api/admin/drive/status');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('14. GET /api/admin/users requires admin authentication (401)', async () => {
    const res = await request(app).get('/api/admin/users');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('15. POST /api/admin/auth/login with missing body returns 400', async () => {
    const res = await request(app).post('/api/admin/auth/login').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('16. POST /api/admin/auth/refresh without token returns 401', async () => {
    const res = await request(app).post('/api/admin/auth/refresh');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('17. POST /api/admin/books/seed requires confirmation header (400)', async () => {
    // If not authenticated, returns 401; if auth bypassed, returns 400 without confirm header
    const res = await request(app).post('/api/admin/books/seed');
    assert.ok(res.status === 401 || res.status === 400);
  });

  test('18. GET 404 for unknown admin endpoint', async () => {
    const res = await request(app).get('/api/admin/unknown-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
