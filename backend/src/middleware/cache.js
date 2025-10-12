const { cache, CACHE_KEYS, CACHE_TTL, generateCacheKey } = require('../config/cache');

/**
 * Generic caching middleware
 * @param {Object} options - Cache configuration
 * @param {Function} options.keyGenerator - Function to generate cache key
 * @param {number} options.ttl - Time to live in seconds
 * @param {boolean} options.skipOnError - Skip caching on error
 * @param {Function} options.condition - Condition to determine if caching should be applied
 */
const cacheMiddleware = (options = {}) => {
  const {
    keyGenerator,
    ttl = 300,
    skipOnError = true,
    condition = () => true,
    invalidatePattern = null
  } = options;

  return async (req, res, next) => {
    // Skip if condition not met
    if (!condition(req)) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) :
        generateCacheKey('default', req.originalUrl, JSON.stringify(req.query));

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });

        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache the response asynchronously
          cache.set(cacheKey, data, ttl).catch(err => {
            if (!skipOnError) {
              console.error('Cache set error:', err);
            }
          });

          // Add cache headers
          res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${ttl}`
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      if (skipOnError) {
        console.warn('Cache middleware error:', error.message);
        return next();
      }
      return next(error);
    }
  };
};

/**
 * Cache invalidation middleware
 * Invalidate cache patterns after successful write operations
 */
const cacheInvalidationMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns asynchronously
        patterns.forEach(pattern => {
          if (typeof pattern === 'function') {
            pattern = pattern(req, data);
          }

          cache.invalidatePattern(pattern).catch(err => {
            console.warn('Cache invalidation error:', err.message);
          });
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Specific cache middleware for different endpoints
 */

// Products list cache
const cacheProductsList = cacheMiddleware({
  keyGenerator: (req) => CACHE_KEYS.PRODUCTS_LIST(
    req.query.page || 1,
    req.query.limit || 10,
    req.query.search || ''
  ),
  ttl: CACHE_TTL.PRODUCT,
  condition: (req) => req.method === 'GET'
});

// Single product cache
const cacheProduct = cacheMiddleware({
  keyGenerator: (req) => CACHE_KEYS.PRODUCT(req.params.id),
  ttl: CACHE_TTL.PRODUCT,
  condition: (req) => req.method === 'GET'
});

// User profile cache
const cacheUserProfile = cacheMiddleware({
  keyGenerator: (req) => CACHE_KEYS.USER(req.user?.userId),
  ttl: CACHE_TTL.USER,
  condition: (req) => req.method === 'GET' && req.user?.userId
});

// Categories cache
const cacheCategories = cacheMiddleware({
  keyGenerator: () => CACHE_KEYS.CATEGORIES_LIST(),
  ttl: CACHE_TTL.CATEGORY
});

// Brands cache
const cacheBrands = cacheMiddleware({
  keyGenerator: () => CACHE_KEYS.BRANDS_LIST(),
  ttl: CACHE_TTL.CATEGORY
});

// Dashboard cache
const cacheDashboard = cacheMiddleware({
  keyGenerator: (req) => CACHE_KEYS.DASHBOARD_DATA(
    req.user?.userId,
    req.user?.branchId
  ),
  ttl: CACHE_TTL.DASHBOARD,
  condition: (req) => req.method === 'GET' && req.user
});

// Analytics cache
const cacheAnalytics = cacheMiddleware({
  keyGenerator: (req) => CACHE_KEYS.SALES_ANALYTICS(
    req.user?.branchId,
    req.query.period || 'today'
  ),
  ttl: CACHE_TTL.ANALYTICS,
  condition: (req) => req.method === 'GET'
});

// Reports cache
const cacheReports = cacheMiddleware({
  keyGenerator: (req) => CACHE_KEYS.REPORTS_DATA(
    req.params.type || 'sales',
    req.query
  ),
  ttl: CACHE_TTL.REPORTS,
  condition: (req) => req.method === 'GET'
});

/**
 * Cache invalidation patterns for write operations
 */

// Invalidate product-related caches
const invalidateProductCaches = cacheInvalidationMiddleware([
  'products_list:*',
  (req) => `product:${req.params.id}`,
  'inventory_summary:*',
  'dashboard:*'
]);

// Invalidate user-related caches
const invalidateUserCaches = cacheInvalidationMiddleware([
  (req) => `user:${req.params.id || req.user?.userId}`,
  (req) => `user_permissions:${req.params.id || req.user?.userId}`,
  'dashboard:*'
]);

// Invalidate sales-related caches
const invalidateSalesCaches = cacheInvalidationMiddleware([
  'sales_analytics:*',
  'dashboard:*',
  'reports:*',
  'inventory_summary:*'
]);

// Invalidate master data caches
const invalidateMasterDataCaches = cacheInvalidationMiddleware([
  'categories_list',
  'brands_list',
  'products_list:*',
  'dashboard:*'
]);

/**
 * Manual cache operations for controllers
 */
const cacheOperations = {
  // Get cached data
  async get(key) {
    return await cache.get(key);
  },

  // Set cache data
  async set(key, data, ttl = 300) {
    return await cache.set(key, data, ttl);
  },

  // Delete cached data
  async delete(key) {
    return await cache.del(key);
  },

  // Invalidate pattern
  async invalidate(pattern) {
    return await cache.invalidatePattern(pattern);
  },

  // Warm up cache
  async warmUp(keys, dataLoader) {
    const promises = keys.map(async ({ key, loader, ttl }) => {
      try {
        const data = await loader();
        await cache.set(key, data, ttl);
        return { key, success: true };
      } catch (error) {
        return { key, success: false, error: error.message };
      }
    });

    return await Promise.allSettled(promises);
  },

  // Cache health check
  async healthCheck() {
    return await cache.healthCheck();
  },

  // Cache statistics
  getStats() {
    return cache.getStats();
  }
};

/**
 * Cache warming utilities
 */
const warmUpCache = async () => {
  console.log('🔥 Warming up cache...');

  try {
    // Warm up common data that doesn't change often
    const warmUpTasks = [
      {
        key: CACHE_KEYS.CATEGORIES_LIST(),
        loader: async () => {
          const Category = require('../models/Category');
          return await Category.find({ isActive: true }).lean();
        },
        ttl: CACHE_TTL.CATEGORY
      },
      {
        key: CACHE_KEYS.BRANDS_LIST(),
        loader: async () => {
          const Brand = require('../models/Brand');
          return await Brand.find({ isActive: true }).lean();
        },
        ttl: CACHE_TTL.CATEGORY
      }
    ];

    const results = await cacheOperations.warmUp(warmUpTasks);
    const successful = results.filter(r => r.value?.success).length;

    console.log(`✅ Cache warm-up completed: ${successful}/${results.length} successful`);
  } catch (error) {
    console.warn('⚠️ Cache warm-up failed:', error.message);
  }
};

module.exports = {
  cacheMiddleware,
  cacheInvalidationMiddleware,

  // Specific middleware
  cacheProductsList,
  cacheProduct,
  cacheUserProfile,
  cacheCategories,
  cacheBrands,
  cacheDashboard,
  cacheAnalytics,
  cacheReports,

  // Invalidation middleware
  invalidateProductCaches,
  invalidateUserCaches,
  invalidateSalesCaches,
  invalidateMasterDataCaches,

  // Operations
  cacheOperations,
  warmUpCache
};
