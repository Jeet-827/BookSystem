/**
 * Query Sanitizer Middleware (Admin Server)
 * Prevents NoSQL Query Injections, Object Injections, and Malicious Query Operators ($gt, $ne, $where, regex bombs)
 * Works alongside Helmet and express-mongo-sanitize to guarantee query safety across all endpoints.
 */

const DANGEROUS_KEY_REGEX = /^\$|(\.\$)/;
const PROTOTYPE_POLLUTION_KEYS = ['__proto__', 'constructor', 'prototype'];

export const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const cleanObj = {};
    for (const [key, val] of Object.entries(value)) {
      if (PROTOTYPE_POLLUTION_KEYS.includes(key.toLowerCase())) {
        continue;
      }
      if (DANGEROUS_KEY_REGEX.test(key)) {
        continue;
      }
      cleanObj[key] = sanitizeValue(val);
    }
    return cleanObj;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
};

export const querySanitizer = (req, res, next) => {
  try {
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }

    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    next();
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Malformed or disallowed query parameter detected.',
    });
  }
};

export default querySanitizer;
