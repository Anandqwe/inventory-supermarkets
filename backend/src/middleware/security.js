const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Security middleware for enhanced protection
 */

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Rate limiting for general API endpoints
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting for registration endpoint
 */
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiting for password change
 */
const passwordChangeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 password changes per 15 minutes
  message: {
    success: false,
    message: 'Too many password change attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  },
  crossOriginEmbedderPolicy: false // Disable for API usage
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Function to recursively sanitize object properties
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

/**
 * Audit logging middleware for security events
 */
const auditLog = (action) => {
  return (req, res, next) => {
    // Store audit info in request for later use
    req.auditInfo = {
      action,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      email: req.user?.email
    };

    // Log the action after response is sent
    const originalSend = res.send;
    res.send = function(data) {
      // Log the audit event
      console.log('AUDIT LOG:', {
        ...req.auditInfo,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });

      // Call the original send method
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * CORS configuration for production
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // In production, replace with your actual allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
      // Add your production domains here
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Request timeout middleware
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeout, () => {
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    });
    next();
  };
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  registerRateLimit,
  passwordChangeRateLimit,
  helmetConfig,
  sanitizeInput,
  auditLog,
  corsOptions,
  requestTimeout,
  securityHeaders
};
