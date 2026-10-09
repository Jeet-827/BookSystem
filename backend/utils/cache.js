// Lightweight TTL Memory Cache to eliminate repeated database round-trips
class MemoryCache {
  constructor(defaultTTL = 60000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.size > 500) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  middleware(ttl = 60000) {
    return (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = req.originalUrl || req.url;
      const cachedResponse = this.get(key);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}, stale-while-revalidate=60`);
        return res.json(cachedResponse);
      }

      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(key, body, ttl);
        }
        return originalJson(body);
      };

      next();
    };
  }
}

export const cache = new MemoryCache(60000);
export default cache;
