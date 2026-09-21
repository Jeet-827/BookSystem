process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import connectDB from '../config/db.js';

describe('BookMart Customer Backend API Tests', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  test('GET /api/health returns status OK and server name', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
    assert.equal(res.body.server, 'BookMart Customer API');
    assert.ok(res.body.timestamp);
  });

  test('GET /api/books returns paginated book catalog', async () => {
    const res = await request(app).get('/api/books');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.books));
    assert.ok(res.body.totalBooks >= 0);
    assert.equal(res.body.currentPage, 1);
  });

  test('GET /api/books with category filter returns matching books', async () => {
    const res = await request(app).get('/api/books?category=Fiction');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.books));
    res.body.books.forEach((book) => {
      assert.equal(book.category, 'Fiction');
    });
  });

  test('GET /api/books/featured returns featured books list', async () => {
    const res = await request(app).get('/api/books/featured');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.books));
  });

  test('GET /api/books/bestsellers returns bestseller books list', async () => {
    const res = await request(app).get('/api/books/bestsellers');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.books));
  });

  test('GET 404 for nonexistent endpoint', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');
    assert.equal(res.status, 404);
    assert.ok(res.body.message.includes('not found'));
  });
});
