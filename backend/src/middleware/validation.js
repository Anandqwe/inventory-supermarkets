const Joi = require('joi');
const { logger, logSecurity } = require('../utils/logger');

/**
 * Enhanced validation middleware using Joi schemas
 * Provides comprehensive request validation with detailed error reporting
 */

class ValidationMiddleware {
  /**
   * Validate request data against Joi schema
   * @param {Object} schema - Joi schema object with optional body, params, query, headers
   * @param {Object} options - Validation options
   */
  static validate(schema, options = {}) {
    const defaultOptions = {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
      convert: true,
      skipValidation: false,
      logErrors: true
    };

    const validationOptions = { ...defaultOptions, ...options };

    return (req, res, next) => {
      if (validationOptions.skipValidation) {
        return next();
      }

      const errors = [];
      const validated = {};

      // Validate body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, {
          ...validationOptions,
          context: { user: req.user, ip: req.ip }
        });

        if (error) {
          errors.push(...this.formatJoiErrors(error, 'body'));
        } else {
          validated.body = value;
        }
      }

      // Validate params
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, validationOptions);

        if (error) {
          errors.push(...this.formatJoiErrors(error, 'params'));
        } else {
          validated.params = value;
        }
      }

      // Validate query
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, validationOptions);

        if (error) {
          errors.push(...this.formatJoiErrors(error, 'query'));
        } else {
          validated.query = value;
        }
      }

      // Validate headers
      if (schema.headers) {
        const { error, value } = schema.headers.validate(req.headers, validationOptions);

        if (error) {
          errors.push(...this.formatJoiErrors(error, 'headers'));
        } else {
          validated.headers = value;
        }
      }

      // Handle validation errors
      if (errors.length > 0) {
        if (validationOptions.logErrors) {
          logSecurity('Validation Failed', 'warn', {
            endpoint: req.originalUrl,
            method: req.method,
            errors: errors,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          validationErrors: errors,
          timestamp: new Date().toISOString()
        });
      }

      // Apply validated data to request
      if (validated.body) req.body = validated.body;
      if (validated.params) req.params = validated.params;
      if (validated.query) req.query = validated.query;
      if (validated.headers) req.headers = { ...req.headers, ...validated.headers };

      next();
    };
  }

  /**
   * Format Joi validation errors into a consistent structure
   * @param {Object} joiError - Joi validation error object
   * @param {string} location - Location of the error (body, params, query, headers)
   */
  static formatJoiErrors(joiError, location) {
    return joiError.details.map(detail => ({
      field: `${location}.${detail.path.join('.')}`,
      message: detail.message.replace(/"/g, ''),
      value: detail.context?.value,
      type: detail.type,
      location
    }));
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitize() {
    return (req, res, next) => {
      try {
        // Recursively sanitize object
        const sanitizeObject = (obj) => {
          if (typeof obj === 'string') {
            return obj
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
              .replace(/javascript:/gi, '') // Remove javascript: URLs
              .replace(/on\w+\s*=/gi, '') // Remove event handlers
              .trim();
          }

          if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
          }

          if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
              sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
          }

          return obj;
        };

        if (req.body) req.body = sanitizeObject(req.body);
        if (req.query) req.query = sanitizeObject(req.query);
        if (req.params) req.params = sanitizeObject(req.params);

        next();
      } catch (error) {
        logger.error('Input sanitization failed', {
          error: error.message,
          endpoint: req.originalUrl,
          method: req.method
        });

        res.status(500).json({
          success: false,
          message: 'Input processing failed',
          error: 'SANITIZATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Rate limiting per endpoint
   */
  static rateLimit(options = {}) {
    const limits = new Map();
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      keyGenerator: (req) => `${req.ip}:${req.originalUrl}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };

    const config = { ...defaultOptions, ...options };

    return (req, res, next) => {
      const key = config.keyGenerator(req);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Clean old entries
      if (limits.has(key)) {
        const requests = limits.get(key).filter(time => time > windowStart);
        limits.set(key, requests);
      }

      const currentRequests = limits.get(key) || [];

      if (currentRequests.length >= config.maxRequests) {
        logSecurity('Rate Limit Exceeded', 'warn', {
          ip: req.ip,
          endpoint: req.originalUrl,
          requestCount: currentRequests.length,
          limit: config.maxRequests,
          windowMs: config.windowMs
        });

        return res.status(429).json({
          success: false,
          message: 'Too many requests',
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(config.windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }

      // Add current request
      currentRequests.push(now);
      limits.set(key, currentRequests);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests,
        'X-RateLimit-Remaining': Math.max(0, config.maxRequests - currentRequests.length),
        'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
      });

      next();
    };
  }

  /**
   * File upload validation
   */
  static validateFileUpload(options = {}) {
    const defaultOptions = {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFiles: 1,
      required: false
    };

    const config = { ...defaultOptions, ...options };

    return (req, res, next) => {
      if (!req.files && !config.required) {
        return next();
      }

      if (!req.files && config.required) {
        return res.status(400).json({
          success: false,
          message: 'File upload required',
          error: 'FILE_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }

      const files = Array.isArray(req.files) ? req.files : [req.files];
      const errors = [];

      if (files.length > config.maxFiles) {
        errors.push({
          field: 'files',
          message: `Maximum ${config.maxFiles} files allowed`,
          value: files.length
        });
      }

      files.forEach((file, index) => {
        if (file.size > config.maxFileSize) {
          errors.push({
            field: `files[${index}]`,
            message: `File size exceeds ${config.maxFileSize} bytes`,
            value: file.size
          });
        }

        if (!config.allowedMimeTypes.includes(file.mimetype)) {
          errors.push({
            field: `files[${index}]`,
            message: `File type ${file.mimetype} not allowed`,
            value: file.mimetype
          });
        }
      });

      if (errors.length > 0) {
        logSecurity('File Upload Validation Failed', 'warn', {
          errors,
          endpoint: req.originalUrl,
          ip: req.ip,
          userId: req.user?.id
        });

        return res.status(400).json({
          success: false,
          message: 'File validation failed',
          error: 'FILE_VALIDATION_ERROR',
          validationErrors: errors,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }
}

// Common validation schemas
const commonSchemas = {
  objectId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().max(50),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().max(100).allow('')
  })
};

module.exports = {
  ValidationMiddleware,
  validate: ValidationMiddleware.validate.bind(ValidationMiddleware),
  sanitize: ValidationMiddleware.sanitize.bind(ValidationMiddleware),
  rateLimit: ValidationMiddleware.rateLimit.bind(ValidationMiddleware),
  validateFileUpload: ValidationMiddleware.validateFileUpload.bind(ValidationMiddleware),
  commonSchemas
};
