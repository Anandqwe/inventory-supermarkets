const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Custom colors for log levels
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  defaultMeta: {
    service: 'inventory-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // HTTP requests log
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true
    })
  ],

  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],

  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Helper functions for structured logging
const loggerHelpers = {
  // Request logging
  logRequest: (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id
      };

      if (res.statusCode >= 400) {
        logger.warn('HTTP Request Error', logData);
      } else {
        logger.http('HTTP Request', logData);
      }
    });

    next();
  },

  // Authentication logging
  logAuth: (action, user, success, details = {}) => {
    const logData = {
      action,
      userId: user?.id || user?._id,
      userEmail: user?.email,
      success,
      ip: details.ip,
      userAgent: details.userAgent,
      ...details
    };

    if (success) {
      logger.info(`Auth: ${action} successful`, logData);
    } else {
      logger.warn(`Auth: ${action} failed`, logData);
    }
  },

  // Database operation logging
  logDatabase: (operation, collection, success, details = {}) => {
    const logData = {
      operation,
      collection,
      success,
      ...details
    };

    if (success) {
      logger.debug(`Database: ${operation} on ${collection}`, logData);
    } else {
      logger.error(`Database: ${operation} failed on ${collection}`, logData);
    }
  },

  // Business logic logging
  logBusiness: (action, success, details = {}) => {
    const logData = {
      action,
      success,
      ...details
    };

    if (success) {
      logger.info(`Business: ${action}`, logData);
    } else {
      logger.warn(`Business: ${action} failed`, logData);
    }
  },

  // Security logging
  logSecurity: (event, severity = 'warn', details = {}) => {
    const logData = {
      securityEvent: event,
      severity,
      ...details
    };

    if (severity === 'critical') {
      logger.error(`Security: ${event}`, logData);
    } else {
      logger.warn(`Security: ${event}`, logData);
    }
  },

  // Performance logging
  logPerformance: (operation, duration, details = {}) => {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...details
    };

    if (duration > 5000) { // Log slow operations (>5s)
      logger.warn(`Performance: Slow operation - ${operation}`, logData);
    } else if (duration > 1000) { // Log medium operations (>1s)
      logger.info(`Performance: Medium operation - ${operation}`, logData);
    } else {
      logger.debug(`Performance: ${operation}`, logData);
    }
  },

  // Error logging with context
  logError: (error, context = {}) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context
    };

    logger.error('Application Error', errorData);
  },

  // API Response logging
  logApiResponse: (endpoint, statusCode, responseTime, details = {}) => {
    const logData = {
      endpoint,
      statusCode,
      responseTime: `${responseTime}ms`,
      ...details
    };

    if (statusCode >= 500) {
      logger.error('API Error Response', logData);
    } else if (statusCode >= 400) {
      logger.warn('API Client Error', logData);
    } else {
      logger.info('API Success Response', logData);
    }
  }
};

// Express middleware for request logging
const requestLogger = (req, res, next) => {
  loggerHelpers.logRequest(req, res, next);
};

// Error handling middleware
const errorLogger = (err, req, res, next) => {
  loggerHelpers.logError(err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  ...loggerHelpers
};
