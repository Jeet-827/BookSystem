process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('BookMart Customer & Admin Backend API Tests', () => {
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

  test('GET /api/health returns status OK and unified server info', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.ok(res.body.server.includes('BookMart'));
    assert.ok(res.body.timestamp);
    assert.ok(typeof res.body.uptime === 'number');
  });

  test('Security headers (Helmet) are present on responses', async () => {
    const res = await request(app).get('/api/health');
    assert.ok(res.headers['x-dns-prefetch-control']);
    assert.ok(res.headers['x-content-type-options']);
  });

  test('GET 404 for nonexistent endpoint returns JSON error', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('not found'));
  });

  test('POST /api/orders without authentication returns 401 Unauthorized', async () => {
    const res = await request(app).post('/api/orders').send({
      items: [{ bookId: '507f1f77bcf86cd799439011', quantity: 1 }],
      paymentMethod: 'card',
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('POST /api/orders/:id/refund without authentication returns 401 Unauthorized', async () => {
    const res = await request(app).post('/api/orders/507f1f77bcf86cd799439011/refund').send({
      reason: 'Wrong format',
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/orders without authentication returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/orders');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/admin/orders without admin auth returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/orders');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/admin/orders/stats without admin auth returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/orders/stats');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('DB dependent tests (skipped automatically if local MongoDB is offline)', async (t) => {
    if (!dbConnected) {
      t.skip('Skipping DB-dependent tests: Local MongoDB instance not reachable');
      return;
    }

    const resBooks = await request(app).get('/api/books');
    assert.equal(resBooks.status, 200);
    assert.ok(Array.isArray(resBooks.body.books));

    const resFeatured = await request(app).get('/api/books/featured');
    assert.equal(resFeatured.status, 200);
    assert.ok(Array.isArray(resFeatured.body.books));

    const resBestsellers = await request(app).get('/api/books/bestsellers');
    assert.equal(resBestsellers.status, 200);
    assert.ok(Array.isArray(resBestsellers.body.books));
  });
});
