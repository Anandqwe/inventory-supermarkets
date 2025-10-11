/**
 * Enhanced Error handling middleware with security features
 */
const ResponseUtils = require('../utils/responseUtils');
const { logSystemEvent } = require('./auditLogger');

// Rate limiting for error tracking
const errorRateLimit = new Map();

/**
 * Enhanced global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Track error rates to detect potential attacks
  trackErrorRate(req);
  
  // Log error for audit trail
  logErrorForAudit(err, req);
  
  // Enhanced logging for debugging
  console.error('=== ERROR DETAILS ===');
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  console.error('Code:', err.code);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Body:', JSON.stringify(req.body, null, 2));
  console.error('User:', req.user);
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.error('Stack:', err.stack);
  }
  console.error('=====================');

  // Sanitize error messages to prevent information disclosure
  const sanitizedError = sanitizeErrorMessage(err, req);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: sanitizeErrorText(e.message),
      value: process.env.NODE_ENV === 'development' ? e.value : undefined
    }));
    return ResponseUtils.validationError(res, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `${sanitizeErrorText(field)} already exists`;
    return ResponseUtils.conflict(res, message);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Invalid identifier format';
    return ResponseUtils.error(res, message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ResponseUtils.unauthorized(res, 'Authentication failed');
  }

  if (err.name === 'TokenExpiredError') {
    return ResponseUtils.unauthorized(res, 'Session expired');
  }

  // MongoDB connection error
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return ResponseUtils.error(res, 'Service temporarily unavailable', 503);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ResponseUtils.error(res, 'File size exceeds limit', 413);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return ResponseUtils.error(res, 'Too many files uploaded', 413);
  }

  // Rate limiting errors
  if (err.message && err.message.includes('Too many requests')) {
    return ResponseUtils.error(res, 'Rate limit exceeded', 429);
  }

  // Security-related errors
  if (err.name === 'SecurityError' || err.type === 'security') {
    logSecurityEvent(err, req);
    return ResponseUtils.error(res, 'Security policy violation', 403);
  }

  // Input validation errors
  if (err.name === 'ValidationFailure' || err.type === 'validation') {
    return ResponseUtils.error(res, 'Invalid input data', 400);
  }

  // Custom application errors
  if (err.statusCode) {
    return ResponseUtils.error(res, sanitizedError.message, err.statusCode);
  }

  // Default server error - show details in test/dev environment
  const isDevelopmentOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const errorMessage = isDevelopmentOrTest ? 
    `${err.name || 'Error'}: ${sanitizedError.message}` : 
    'An unexpected error occurred';
    
  return ResponseUtils.error(res, errorMessage);
};

/**
 * Track error rates to detect potential attacks
 */
function trackErrorRate(req) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  
  if (!errorRateLimit.has(ip)) {
    errorRateLimit.set(ip, []);
  }
  
  const errors = errorRateLimit.get(ip);
  
  // Remove old errors outside the window
  const recentErrors = errors.filter(time => now - time < windowMs);
  recentErrors.push(now);
  
  errorRateLimit.set(ip, recentErrors);
  
  // Alert if too many errors from same IP
  if (recentErrors.length > 20) {
    logSecurityEvent({
      type: 'high_error_rate',
      message: `High error rate detected from IP: ${ip}`,
      ip,
      errorCount: recentErrors.length
    }, req);
  }
}

/**
 * Log error for audit trail
 */
async function logErrorForAudit(err, req) {
  // Skip error audit logging during tests
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  try {
    const action = 'system_error';
    const description = `Error occurred: ${err.name || 'Unknown'} - ${err.message}`;
    
    await logSystemEvent(action, description, {
      errorName: err.name,
      errorCode: err.code,
      statusCode: err.statusCode,
      url: req.url,
      method: req.method,
      userId: req.user?.userId,
      ip: req.ip,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } catch (logError) {
    console.error('Failed to log error for audit:', logError);
  }
}

/**
 * Log security events
 */
async function logSecurityEvent(error, req) {
  // Skip security audit logging during tests
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  try {
    await logSystemEvent('security_event', error.message || 'Security policy violation', {
      errorType: error.type || error.name,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user?.userId,
      riskLevel: 'high'
    });
  } catch (logError) {
    console.error('Failed to log security event:', logError);
  }
}

/**
 * Sanitize error messages to prevent information disclosure
 */
function sanitizeErrorMessage(err, req) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isAuthenticated = req.user && req.user.userId;
  
  // In production, never expose sensitive error details to unauthenticated users
  if (!isDevelopment && !isAuthenticated) {
    return {
      message: 'An error occurred',
      code: 'GENERIC_ERROR'
    };
  }
  
  // Even in development, sanitize certain sensitive errors
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /connection string/i,
    /mongodb/i
  ];
  
  const message = err.message || 'Unknown error';
  
  if (sensitivePatterns.some(pattern => pattern.test(message))) {
    return {
      message: 'Configuration error',
      code: 'CONFIG_ERROR'
    };
  }
  
  return {
    message: sanitizeErrorText(message),
    code: err.code || 'UNKNOWN_ERROR'
  };
}

/**
 * Sanitize error text to remove sensitive information
 */
function sanitizeErrorText(text) {
  if (!text || typeof text !== 'string') {
    return 'Unknown error';
  }
  
  // Remove potential file paths
  text = text.replace(/[A-Za-z]:\\[\w\\]+/g, '[PATH]');
  text = text.replace(/\/[\w\/]+/g, '[PATH]');
  
  // Remove potential database connection strings
  text = text.replace(/mongodb:\/\/[^"\s]+/g, '[CONNECTION]');
  
  // Remove potential IP addresses
  text = text.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');
  
  // Remove potential port numbers in URLs
  text = text.replace(/:\d{4,5}/g, ':[PORT]');
  
  return text;
}

/**
 * 404 Not Found handler with rate limiting
 */
const notFoundHandler = (req, res) => {
  // Track 404s for potential scanning attempts
  track404Rate(req);
  
  ResponseUtils.notFound(res, 'Resource not found');
};

/**
 * Track 404 rates to detect scanning attempts
 */
function track404Rate(req) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const key = `404_${ip}`;
  
  if (!errorRateLimit.has(key)) {
    errorRateLimit.set(key, []);
  }
  
  const attempts = errorRateLimit.get(key);
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  recentAttempts.push(now);
  
  errorRateLimit.set(key, recentAttempts);
  
  // Alert if potential scanning detected
  if (recentAttempts.length > 50) {
    logSecurityEvent({
      type: 'potential_scanning',
      message: `High 404 rate detected from IP: ${ip}`,
      ip,
      attemptCount: recentAttempts.length
    }, req);
  }
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      // Enhanced error logging for debugging
      console.error('=== ASYNC HANDLER ERROR ===');
      console.error('Function name:', fn.name);
      console.error('URL:', req.url);
      console.error('Method:', req.method);
      console.error('Error:', err);
      console.error('=========================');
      next(err);
    });
  };
};

/**
 * Enhanced custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, type = 'application') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Security error class
 */
class SecurityError extends AppError {
  constructor(message, statusCode = 403) {
    super(message, statusCode, 'security');
    this.name = 'SecurityError';
  }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
  constructor(message, statusCode = 400) {
    super(message, statusCode, 'validation');
    this.name = 'ValidationFailure';
  }
}

/**
 * Enhanced validation error handler for express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Track validation failures for potential attack detection
    trackValidationFailures(req);
    
    // Sanitize error messages
    const sanitizedErrors = errors.array().map(error => ({
      field: error.param,
      message: sanitizeErrorText(error.msg),
      value: process.env.NODE_ENV === 'development' ? error.value : undefined
    }));
    
    return ResponseUtils.validationError(res, sanitizedErrors);
  }
  
  next();
};

/**
 * Track validation failures to detect potential attacks
 */
function trackValidationFailures(req) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const key = `validation_${ip}`;
  
  if (!errorRateLimit.has(key)) {
    errorRateLimit.set(key, []);
  }
  
  const failures = errorRateLimit.get(key);
  const recentFailures = failures.filter(time => now - time < windowMs);
  recentFailures.push(now);
  
  errorRateLimit.set(key, recentFailures);
  
  // Alert if too many validation failures
  if (recentFailures.length > 30) {
    logSecurityEvent({
      type: 'excessive_validation_failures',
      message: `Excessive validation failures from IP: ${ip}`,
      ip,
      failureCount: recentFailures.length
    }, req);
  }
}

/**
 * Enhanced request logger middleware with security monitoring
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Enhanced logging with security context
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.userId,
    sessionId: req.sessionID
  };
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code execution
    /eval\(/i // Code evaluation
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || pattern.test(JSON.stringify(req.body))
  );
  
  if (isSuspicious) {
    logData.suspicious = true;
    logSecurityEvent({
      type: 'suspicious_request',
      message: `Suspicious request pattern detected`,
      url: req.url,
      body: req.body
    }, req);
  }
  
  console.log(`${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Enhanced response logging
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 5000) {
      logSecurityEvent({
        type: 'slow_request',
        message: `Slow request detected: ${duration}ms`,
        duration
      }, req);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Enhanced security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Set comprehensive security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Strict Transport Security (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  
  next();
};

/**
 * Enhanced CORS configuration with security features and demo mode support
 */
const DEMO_CONFIG = require('../config/demo');

const corsOptions = {
  origin: function (origin, callback) {
    // In demo mode, development, or test mode, be more permissive
    if (DEMO_CONFIG.demoMode || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // Allow requests with no origin (mobile apps, postman, tests, etc.)
      if (!origin) {
        return callback(null, true);
      }
    }
    
    // Combine configured origins with demo origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4200',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4200',
      'https://your-frontend-domain.vercel.app',
      process.env.FRONTEND_URL,
      ...(DEMO_CONFIG.frontend?.corsOrigins || [])
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In demo mode or test mode, allow any localhost/127.0.0.1 origin
      if ((DEMO_CONFIG.demoMode || process.env.NODE_ENV === 'test') && origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      
      // In test mode, allow all origins
      if (process.env.NODE_ENV === 'test') {
        return callback(null, true);
      }
      
      // Log unauthorized CORS attempts (but not during tests)
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`CORS blocked request from origin: ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Correlation-ID',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  SecurityError,
  ValidationError,
  handleValidationErrors,
  requestLogger,
  securityHeaders,
  corsOptions
};
