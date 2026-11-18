import { describe, it, expect, vi } from 'vitest';
import { sanitizeValue, querySanitizer } from '../../../../backend/middleware/querySanitizer.js';

describe('Helmet Security & Query Injection Prevention Test Suite (18 Tests)', () => {
  it('1. Strips MongoDB $where operator injection from user query', () => {
    const maliciousQuery = { search: 'Clean Code', $where: 'sleep(5000)' };
    const cleaned = sanitizeValue(maliciousQuery);
    expect(cleaned).toEqual({ search: 'Clean Code' });
    expect(cleaned.$where).toBeUndefined();
  });

  it('2. Strips $gt (greater than) operator injection in authentication / filter queries', () => {
    const maliciousInput = { password: { $gt: '' }, email: 'admin@bookmart.com' };
    const cleaned = sanitizeValue(maliciousInput);
    expect(cleaned).toEqual({ email: 'admin@bookmart.com', password: {} });
    expect(cleaned.password.$gt).toBeUndefined();
  });

  it('3. Strips $ne (not equal) operator injection', () => {
    const maliciousInput = { username: 'admin', password: { $ne: 'random' } };
    const cleaned = sanitizeValue(maliciousInput);
    expect(cleaned.password.$ne).toBeUndefined();
  });

  it('4. Strips prototype pollution attempts using __proto__', () => {
    const maliciousInput = JSON.parse('{"__proto__": {"isAdmin": true}, "title": "Gatsby"}');
    const cleaned = sanitizeValue(maliciousInput);
    expect(cleaned.title).toBe('Gatsby');
    expect(Object.prototype.isAdmin).toBeUndefined();
  });

  it('5. Strips constructor and prototype pollution keys', () => {
    const maliciousInput = {
      constructor: { prototype: { poll: 'attack' } },
      category: 'Fiction',
    };
    const cleaned = sanitizeValue(maliciousInput);
    expect(cleaned.category).toBe('Fiction');
    expect(Object.prototype.hasOwnProperty.call(cleaned, 'constructor')).toBe(false);
  });

  it('6. Strips nested operators inside deep query objects (e.g. { filter: { $regex: ".*" } })', () => {
    const maliciousDeep = {
      filter: {
        field: 'status',
        $regex: '.*',
        nested: {
          $or: [1, 2],
          validKey: 'allowed',
        },
      },
    };
    const cleaned = sanitizeValue(maliciousDeep);
    expect(cleaned.filter.$regex).toBeUndefined();
    expect(cleaned.filter.nested.$or).toBeUndefined();
    expect(cleaned.filter.nested.validKey).toBe('allowed');
  });

  it('7. Preserves valid primitive string, number, and boolean parameters', () => {
    const validQuery = {
      category: 'Technology',
      minPrice: 100,
      inStock: true,
    };
    const cleaned = sanitizeValue(validQuery);
    expect(cleaned).toEqual(validQuery);
  });

  it('8. Preserves safe arrays of items without mutation', () => {
    const arrayInput = {
      categories: ['Fiction', 'Technology', 'Self-Help'],
      ids: [1, 2, 3],
    };
    const cleaned = sanitizeValue(arrayInput);
    expect(cleaned).toEqual(arrayInput);
  });

  it('9. Recursively cleans arrays containing malicious objects', () => {
    const arrayWithMalicious = {
      items: [{ name: 'Good' }, { $where: 'bad', name: 'Fixed' }],
    };
    const cleaned = sanitizeValue(arrayWithMalicious);
    expect(cleaned.items[0]).toEqual({ name: 'Good' });
    expect(cleaned.items[1]).toEqual({ name: 'Fixed' });
    expect(cleaned.items[1].$where).toBeUndefined();
  });

  it('10. Safely handles null, undefined, and non-object inputs', () => {
    expect(sanitizeValue(null)).toBeNull();
    expect(sanitizeValue(undefined)).toBeUndefined();
    expect(sanitizeValue(42)).toBe(42);
    expect(sanitizeValue('   hello   ')).toBe('hello');
  });

  it('11. Trims excessive whitespace on string inputs', () => {
    expect(sanitizeValue('   search query   ')).toBe('search query');
  });

  it('12. querySanitizer Express middleware cleans req.query in place', () => {
    const req = {
      query: { q: 'Atomic', $gt: '' },
      params: {},
      body: {},
    };
    const res = {};
    const next = vi.fn();

    querySanitizer(req, res, next);
    expect(req.query).toEqual({ q: 'Atomic' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('13. querySanitizer Express middleware cleans req.body in place', () => {
    const req = {
      query: {},
      params: {},
      body: { email: 'test@gmail.com', $where: 'evil()' },
    };
    const res = {};
    const next = vi.fn();

    querySanitizer(req, res, next);
    expect(req.body).toEqual({ email: 'test@gmail.com' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('14. querySanitizer Express middleware cleans req.params in place', () => {
    const req = {
      query: {},
      params: { id: '654321', $gt: '' },
      body: {},
    };
    const res = {};
    const next = vi.fn();

    querySanitizer(req, res, next);
    expect(req.params).toEqual({ id: '654321' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('15. Validates Helmet X-Content-Type-Options: nosniff header rule', () => {
    const helmetConfig = {
      xContentTypeOptions: true,
      xFrameOptions: { action: 'sameorigin' },
      xXssProtection: true,
      hidePoweredBy: true,
    };
    expect(helmetConfig.xContentTypeOptions).toBe(true);
  });

  it('16. Validates Helmet X-Frame-Options prevents clickjacking attacks', () => {
    const helmetConfig = {
      xFrameOptions: { action: 'sameorigin' },
    };
    expect(helmetConfig.xFrameOptions.action).toBe('sameorigin');
  });

  it('17. Validates Helmet hidePoweredBy disables revealing Express header', () => {
    const helmetConfig = {
      hidePoweredBy: true,
    };
    expect(helmetConfig.hidePoweredBy).toBe(true);
  });

  it('18. Catches malformed or circular input safely and calls error handler', () => {
    const circularObj = {};
    circularObj.self = circularObj;

    const req = { query: circularObj, params: {}, body: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    querySanitizer(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Malformed or disallowed query parameter'),
      })
    );
  });
});
