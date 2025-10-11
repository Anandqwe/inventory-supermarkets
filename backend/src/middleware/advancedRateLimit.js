const rateLimit = require('express-rate-limit');
const { cache } = require('../config/cache');

/**
 * Enhanced rate limiting with multiple tiers and caching
 */

// Custom store using cache for distributed rate limiting
const createCacheStore = (keyGenerator) => {
  return {
    async incr(key, callback) {
      try {
        const cacheKey = `rateLimit:${keyGenerator ? keyGenerator(key) : key}`;
        const current = await cache.get(cacheKey);
        const count = (current?.count || 0) + 1;
        const resetTime = current?.resetTime || Date.now() + (15 * 60 * 1000); // 15 minutes
        
        await cache.set(cacheKey, { count, resetTime }, 900); // 15 minutes TTL
        
        callback(null, count, new Date(resetTime));
      } catch (error) {
        callback(error);
      }
    },

    async decrement(key, callback) {
      try {
        const cacheKey = `rateLimit:${keyGenerator ? keyGenerator(key) : key}`;
        const current = await cache.get(cacheKey);
        
        if (current && current.count > 0) {
          const count = current.count - 1;
          await cache.set(cacheKey, { ...current, count }, 900);
          callback(null, count, new Date(current.resetTime));
        } else {
          callback(null, 0);
        }
      } catch (error) {
        callback(error);
      }
    },

    async resetKey(key, callback) {
      try {
        const cacheKey = `rateLimit:${keyGenerator ? keyGenerator(key) : key}`;
        await cache.del(cacheKey);
        callback(null);
      } catch (error) {
        callback(error);
      }
    }
  };
};

// Rate limit configurations
const rateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      type: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...(process.env.NODE_ENV !== 'test' && { store: createCacheStore() })
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit to 10 auth attempts per IP
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      type: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    ...(process.env.NODE_ENV !== 'test' && { store: createCacheStore((key) => `auth:${key}`) })
  },

  // Login specific (even stricter)
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 login attempts per IP
    message: {
      success: false,
      message: 'Too many login attempts, please try again later.',
      type: 'LOGIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    ...(process.env.NODE_ENV !== 'test' && { store: createCacheStore((key) => `login:${key}`) })
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 password reset attempts per hour
    message: {
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      type: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `passwordReset:${key}`)
  },

  // API endpoints for different user roles
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Higher limit for admins
    message: {
      success: false,
      message: 'Admin rate limit exceeded.',
      type: 'ADMIN_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `admin:${key}`)
  },

  manager: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1500, // Moderate limit for managers
    message: {
      success: false,
      message: 'Manager rate limit exceeded.',
      type: 'MANAGER_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `manager:${key}`)
  },

  staff: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 800, // Standard limit for staff
    message: {
      success: false,
      message: 'Staff rate limit exceeded.',
      type: 'STAFF_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `staff:${key}`)
  },

  // POS operations (higher frequency allowed)
  pos: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Higher frequency for POS operations
    message: {
      success: false,
      message: 'POS rate limit exceeded.',
      type: 'POS_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `pos:${key}`)
  },

  // Report generation (limited due to resource intensity)
  reports: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limited report generation
    message: {
      success: false,
      message: 'Report generation rate limit exceeded.',
      type: 'REPORTS_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `reports:${key}`)
  },

  // File uploads
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limited uploads
    message: {
      success: false,
      message: 'File upload rate limit exceeded.',
      type: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createCacheStore((key) => `upload:${key}`)
  }
};

// Create rate limiters
const rateLimiters = {};
Object.keys(rateLimitConfigs).forEach(key => {
  rateLimiters[key] = rateLimit(rateLimitConfigs[key]);
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicRateLimit = (req, res, next) => {
  const userRole = req.user?.role || 'staff';
  
  // Use role-specific rate limiter if available
  if (rateLimiters[userRole]) {
    return rateLimiters[userRole](req, res, next);
  }
  
  // Fallback to general rate limiter
  return rateLimiters.general(req, res, next);
};

/**
 * Endpoint-specific rate limiters
 */
const endpointRateLimiters = {
  // Authentication
  login: rateLimiters.login,
  auth: rateLimiters.auth,
  passwordReset: rateLimiters.passwordReset,
  
  // Operations
  pos: rateLimiters.pos,
  reports: rateLimiters.reports,
  upload: rateLimiters.upload,
  
  // Role-based
  admin: rateLimiters.admin,
  manager: rateLimiters.manager,
  staff: rateLimiters.staff,
  
  // General
  general: rateLimiters.general
};

/**
 * Whitelist middleware - bypass rate limiting for certain IPs
 */
const createWhitelistMiddleware = (whitelist = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check if IP is whitelisted
    if (whitelist.includes(clientIP)) {
      req.skipRateLimit = true;
    }
    
    next();
  };
};

/**
 * Rate limit bypass for certain conditions
 */
const createBypassMiddleware = (bypassCondition) => {
  return (req, res, next) => {
    if (bypassCondition(req)) {
      req.skipRateLimit = true;
    }
    next();
  };
};

/**
 * Enhanced rate limiter with custom logic
 */
const createEnhancedRateLimit = (options) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    keyGenerator,
    skipCondition,
    onLimitReached,
    ...otherOptions
  } = options;

  const limiter = rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator || undefined,
    skip: (req) => {
      if (req.skipRateLimit) return true;
      if (skipCondition) return skipCondition(req);
      return false;
    },
    onLimitReached: (req, res, options) => {
      // Log rate limit exceeded
      console.warn(`Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.originalUrl}`);
      
      // Custom callback
      if (onLimitReached) {
        onLimitReached(req, res, options);
      }
    },
    store: createCacheStore(keyGenerator),
    ...otherOptions
  });

  return limiter;
};

/**
 * Rate limiting analytics
 */
const rateLimitAnalytics = {
  async getStats(type = 'general') {
    try {
      const pattern = `rateLimit:${type}:*`;
      const keys = await cache.keys(pattern);
      
      const stats = {
        type,
        totalKeys: keys.length,
        activeConnections: 0,
        nearLimit: 0,
        atLimit: 0
      };

      for (const key of keys) {
        const data = await cache.get(key);
        if (data) {
          stats.activeConnections++;
          const limit = rateLimitConfigs[type]?.max || 100;
          
          if (data.count >= limit) {
            stats.atLimit++;
          } else if (data.count >= limit * 0.8) {
            stats.nearLimit++;
          }
        }
      }

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  },

  async clearLimits(type = null, ip = null) {
    try {
      let pattern = 'rateLimit:';
      
      if (type && ip) {
        pattern += `${type}:${ip}`;
      } else if (type) {
        pattern += `${type}:*`;
      } else {
        pattern += '*';
      }

      return await cache.invalidatePattern(pattern);
    } catch (error) {
      console.error('Error clearing rate limits:', error);
      return 0;
    }
  }
};

module.exports = {
  // Individual rate limiters
  ...endpointRateLimiters,
  
  // Dynamic and enhanced limiters
  dynamicRateLimit,
  createEnhancedRateLimit,
  
  // Utility middleware
  createWhitelistMiddleware,
  createBypassMiddleware,
  
  // Analytics and management
  rateLimitAnalytics,
  
  // Configurations
  rateLimitConfigs
};