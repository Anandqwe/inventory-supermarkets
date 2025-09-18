const Redis = require('ioredis');
const NodeCache = require('node-cache');

// In-memory cache fallback
const memoryCache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false
});

let redisClient = null;
let isRedisConnected = false;

// Initialize Redis connection
const initRedis = async () => {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis connection error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('close', () => {
      console.log('❌ Redis connection closed');
      isRedisConnected = false;
    });

    // Test connection
    await redisClient.ping();
    
  } catch (error) {
    console.warn('⚠️ Redis initialization failed:', error.message);
    console.log('📝 Falling back to in-memory cache');
    isRedisConnected = false;
  }
};

// Cache wrapper with fallback
class CacheManager {
  async get(key) {
    try {
      if (isRedisConnected && redisClient) {
        const result = await redisClient.get(key);
        return result ? JSON.parse(result) : null;
      }
    } catch (error) {
      console.warn('Cache get error (Redis):', error.message);
    }
    
    // Fallback to memory cache
    return memoryCache.get(key) || null;
  }

  async set(key, value, ttl = 600) {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.setex(key, ttl, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      console.warn('Cache set error (Redis):', error.message);
    }
    
    // Fallback to memory cache
    return memoryCache.set(key, value, ttl);
  }

  async del(key) {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
      }
    } catch (error) {
      console.warn('Cache delete error (Redis):', error.message);
    }
    
    // Also delete from memory cache
    return memoryCache.del(key);
  }

  async flush() {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.flushdb();
      }
    } catch (error) {
      console.warn('Cache flush error (Redis):', error.message);
    }
    
    // Also flush memory cache
    return memoryCache.flushAll();
  }

  async keys(pattern = '*') {
    try {
      if (isRedisConnected && redisClient) {
        return await redisClient.keys(pattern);
      }
    } catch (error) {
      console.warn('Cache keys error (Redis):', error.message);
    }
    
    // Fallback to memory cache
    return memoryCache.keys();
  }

  // Batch operations
  async mget(keys) {
    const results = {};
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    return results;
  }

  async mset(keyValuePairs, ttl = 600) {
    const promises = Object.entries(keyValuePairs).map(([key, value]) =>
      this.set(key, value, ttl)
    );
    return await Promise.all(promises);
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern) {
    try {
      if (isRedisConnected && redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
        return keys.length;
      }
    } catch (error) {
      console.warn('Cache invalidation error (Redis):', error.message);
    }
    
    // For memory cache, we need to check each key
    const allKeys = memoryCache.keys();
    const matchingKeys = allKeys.filter(key => 
      key.includes(pattern.replace('*', ''))
    );
    matchingKeys.forEach(key => memoryCache.del(key));
    return matchingKeys.length;
  }

  // Health check
  async healthCheck() {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.ping();
        return { status: 'healthy', type: 'redis' };
      }
    } catch (error) {
      // Redis failed, check memory cache
      memoryCache.set('test', 'test', 1);
      const test = memoryCache.get('test');
      memoryCache.del('test');
      
      return { 
        status: test === 'test' ? 'healthy' : 'unhealthy', 
        type: 'memory',
        error: error.message 
      };
    }
    
    return { status: 'healthy', type: 'memory' };
  }

  // Statistics
  getStats() {
    const memStats = memoryCache.getStats();
    
    return {
      redis: {
        connected: isRedisConnected,
        client: redisClient ? 'ioredis' : null
      },
      memory: {
        keys: memStats.keys,
        hits: memStats.hits,
        misses: memStats.misses,
        hitRate: memStats.hits / (memStats.hits + memStats.misses) || 0
      }
    };
  }
}

// Create singleton instance
const cache = new CacheManager();

// Cache key generators
const generateCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.filter(arg => arg !== undefined).join(':')}`;
};

// Common cache patterns
const CACHE_KEYS = {
  USER: (id) => generateCacheKey('user', id),
  USER_PERMISSIONS: (id) => generateCacheKey('user_permissions', id),
  PRODUCT: (id) => generateCacheKey('product', id),
  PRODUCTS_LIST: (page, limit, search) => generateCacheKey('products_list', page, limit, search),
  CATEGORY: (id) => generateCacheKey('category', id),
  CATEGORIES_LIST: () => generateCacheKey('categories_list'),
  BRAND: (id) => generateCacheKey('brand', id),
  BRANDS_LIST: () => generateCacheKey('brands_list'),
  SALES_ANALYTICS: (branchId, period) => generateCacheKey('sales_analytics', branchId, period),
  INVENTORY_SUMMARY: (branchId) => generateCacheKey('inventory_summary', branchId),
  DASHBOARD_DATA: (userId, branchId) => generateCacheKey('dashboard', userId, branchId),
  REPORTS_DATA: (type, params) => generateCacheKey('reports', type, JSON.stringify(params))
};

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  USER: 300, // 5 minutes
  PRODUCT: 600, // 10 minutes
  CATEGORY: 1800, // 30 minutes
  ANALYTICS: 300, // 5 minutes
  DASHBOARD: 120, // 2 minutes
  REPORTS: 600, // 10 minutes
  SESSION: 3600 // 1 hour
};

module.exports = {
  cache,
  initRedis,
  CACHE_KEYS,
  CACHE_TTL,
  generateCacheKey,
  redisClient: () => redisClient,
  isRedisConnected: () => isRedisConnected
};