import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import connectDB from '../config/db.js';

describe('BookMart Admin Server API Tests', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await mongoose.connection.close();
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

  test('GET 404 for unknown admin endpoint', async () => {
    const res = await request(app).get('/api/admin/unknown-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
