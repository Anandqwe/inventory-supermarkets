/**
 * Cache Configuration
 * Redis with Node-Cache fallback
 */
const redis = require('redis');
const NodeCache = require('node-cache');

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  PRODUCT: 300,      // 5 minutes
  USER: 600,         // 10 minutes
  CATEGORY: 1800,    // 30 minutes
  DASHBOARD: 60,     // 1 minute
  REPORTS: 300,      // 5 minutes
  SHORT: 60,         // 1 minute
  MEDIUM: 300,       // 5 minutes
  LONG: 1800         // 30 minutes
};

// Cache key patterns
const CACHE_KEYS = {
  PRODUCTS_LIST: (page, limit, search) => `products:list:${page}:${limit}:${search}`,
  PRODUCT: (id) => `product:${id}`,
  USER: (id) => `user:${id}`,
  CATEGORIES_LIST: () => 'categories:list',
  BRANDS_LIST: () => 'brands:list',
  UNITS_LIST: () => 'units:list',
  SUPPLIERS_LIST: () => 'suppliers:list',
  BRANCHES_LIST: () => 'branches:list',
  DASHBOARD: (period) => `dashboard:${period}`,
  SALES_CHART: (period) => `sales:chart:${period}`,
  INVENTORY_ANALYTICS: () => 'inventory:analytics'
};

class CacheManager {
  constructor() {
    this.redisClient = null;
    this.nodeCache = new NodeCache({
      stdTTL: CACHE_TTL.MEDIUM,
      checkperiod: 120,
      useClones: false
    });
    this.isRedisConnected = false;
    
    this.initRedis();
  }

  async initRedis() {
    try {
      // Try to connect to Redis if URL is provided
      if (process.env.REDIS_URL) {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 3) {
                console.warn('⚠️ Redis max retries reached, using Node Cache fallback');
                return false;
              }
              return Math.min(retries * 100, 3000);
            }
          }
        });

        this.redisClient.on('error', (err) => {
          console.warn('⚠️ Redis error:', err.message);
          this.isRedisConnected = false;
        });

        this.redisClient.on('connect', () => {
          console.log('✅ Redis cache connected');
          this.isRedisConnected = true;
        });

        this.redisClient.on('ready', () => {
          this.isRedisConnected = true;
        });

        await this.redisClient.connect();
      } else {
        console.log('ℹ️ No Redis URL configured, using Node Cache');
      }
    } catch (error) {
      console.warn('⚠️ Redis connection failed, using Node Cache fallback:', error.message);
      this.isRedisConnected = false;
    }
  }

  async get(key) {
    try {
      // Try Redis first
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }
      
      // Fallback to Node Cache
      return this.nodeCache.get(key);
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = CACHE_TTL.MEDIUM) {
    try {
      // Try Redis first
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      }
      
      // Always set in Node Cache as backup
      this.nodeCache.set(key, value, ttl);
      return true;
    } catch (error) {
      console.warn('Cache set error:', error.message);
      // Try Node Cache if Redis fails
      this.nodeCache.set(key, value, ttl);
      return false;
    }
  }

  async del(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }
      this.nodeCache.del(key);
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error.message);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      // For Redis, use SCAN to find matching keys
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
      
      // For Node Cache, manually check keys
      const allKeys = this.nodeCache.keys();
      const matchingKeys = allKeys.filter(key => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(key);
      });
      
      matchingKeys.forEach(key => this.nodeCache.del(key));
      
      return true;
    } catch (error) {
      console.warn('Cache pattern invalidation error:', error.message);
      return false;
    }
  }

  async clear() {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushDb();
      }
      this.nodeCache.flushAll();
      return true;
    } catch (error) {
      console.warn('Cache clear error:', error.message);
      return false;
    }
  }

  getStats() {
    return {
      redis: this.isRedisConnected,
      nodeCache: this.nodeCache.getStats()
    };
  }
}

// Helper function to generate cache key
const generateCacheKey = (...parts) => {
  return parts.filter(Boolean).join(':');
};

// Create singleton instance
const cache = new CacheManager();

module.exports = {
  cache,
  CACHE_KEYS,
  CACHE_TTL,
  generateCacheKey
};
