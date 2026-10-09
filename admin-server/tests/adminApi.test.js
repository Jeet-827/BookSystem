process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('BookMart Admin Server API Tests', () => {
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

  test('GET /api/health returns status OK and admin server name', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.equal(res.body.server, 'BookMart Admin Server');
  });

  test('GET /api/admin/health returns admin service status', async () => {
    const res = await request(app).get('/api/admin/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.equal(res.body.service, 'BookMart Admin Service');
  });

  test('GET /api/admin/dashboard/metrics requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/dashboard/metrics');
    assert.equal(res.status, 401);
  });

  test('GET /api/admin/orders requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/orders');
    assert.equal(res.status, 401);
  });

  test('GET /api/admin/orders/stats requires authentication (401)', async () => {
    const res = await request(app).get('/api/admin/orders/stats');
    assert.equal(res.status, 401);
  });

  test('GET 404 for unknown admin endpoint', async () => {
    const res = await request(app).get('/api/admin/unknown-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
