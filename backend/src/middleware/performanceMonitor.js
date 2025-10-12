const { cache } = require('../config/cache');

/**
 * Performance monitoring and metrics collection
 */

// Metrics storage
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    byMethod: {},
    byRoute: {},
    byStatusCode: {}
  },
  performance: {
    averageResponseTime: 0,
    slowQueries: [],
    memoryUsage: [],
    cpuUsage: []
  },
  errors: {
    total: 0,
    byType: {},
    recent: []
  },
  database: {
    queries: 0,
    slowQueries: 0,
    connections: 0
  }
};

/**
 * Request performance monitoring middleware
 */
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const endMemory = process.memoryUsage();

    // Collect metrics
    collectRequestMetrics({
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      responseTime,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Add performance headers
    if (!res.headersSent) {
      res.set({
        'X-Response-Time': `${responseTime.toFixed(2)}ms`,
        'X-Memory-Usage': `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
      });
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Collect request metrics
 */
const collectRequestMetrics = (data) => {
  // Update request counters
  metrics.requests.total++;

  if (data.statusCode >= 200 && data.statusCode < 400) {
    metrics.requests.successful++;
  } else {
    metrics.requests.failed++;
  }

  // Update method stats
  metrics.requests.byMethod[data.method] =
    (metrics.requests.byMethod[data.method] || 0) + 1;

  // Update route stats
  if (data.route) {
    metrics.requests.byRoute[data.route] =
      (metrics.requests.byRoute[data.route] || 0) + 1;
  }

  // Update status code stats
  metrics.requests.byStatusCode[data.statusCode] =
    (metrics.requests.byStatusCode[data.statusCode] || 0) + 1;

  // Update performance metrics
  updatePerformanceMetrics(data);

  // Cache metrics every 100 requests
  if (metrics.requests.total % 100 === 0) {
    cacheMetrics();
  }
};

/**
 * Update performance metrics
 */
const updatePerformanceMetrics = (data) => {
  // Calculate rolling average response time
  const currentAvg = metrics.performance.averageResponseTime;
  const totalRequests = metrics.requests.total;
  metrics.performance.averageResponseTime =
    (currentAvg * (totalRequests - 1) + data.responseTime) / totalRequests;

  // Track slow queries (>1000ms)
  if (data.responseTime > 1000) {
    metrics.performance.slowQueries.push({
      route: data.route,
      method: data.method,
      responseTime: data.responseTime,
      timestamp: new Date(),
      statusCode: data.statusCode
    });

    // Keep only last 50 slow queries
    if (metrics.performance.slowQueries.length > 50) {
      metrics.performance.slowQueries = metrics.performance.slowQueries.slice(-50);
    }
  }

  // Track memory usage every 10 requests
  if (metrics.requests.total % 10 === 0) {
    const memUsage = process.memoryUsage();
    metrics.performance.memoryUsage.push({
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      timestamp: new Date()
    });

    // Keep only last 100 memory snapshots
    if (metrics.performance.memoryUsage.length > 100) {
      metrics.performance.memoryUsage = metrics.performance.memoryUsage.slice(-100);
    }
  }
};

/**
 * Error tracking middleware
 */
const errorTracker = (err, req, res, next) => {
  // Update error metrics
  metrics.errors.total++;

  const errorType = err.name || 'UnknownError';
  metrics.errors.byType[errorType] =
    (metrics.errors.byType[errorType] || 0) + 1;

  // Store recent errors
  metrics.errors.recent.push({
    type: errorType,
    message: err.message,
    stack: err.stack,
    route: req.route?.path || req.path,
    method: req.method,
    timestamp: new Date(),
    ip: req.ip
  });

  // Keep only last 20 errors
  if (metrics.errors.recent.length > 20) {
    metrics.errors.recent = metrics.errors.recent.slice(-20);
  }

  next(err);
};

/**
 * System metrics collection
 */
const collectSystemMetrics = () => {
  setInterval(() => {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    // CPU usage calculation (simplified)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    metrics.performance.cpuUsage.push({
      user: cpuUsage.user,
      system: cpuUsage.system,
      percent: cpuPercent,
      timestamp: new Date()
    });

    // Keep only last 60 CPU measurements (1 hour at 1-minute intervals)
    if (metrics.performance.cpuUsage.length > 60) {
      metrics.performance.cpuUsage = metrics.performance.cpuUsage.slice(-60);
    }
  }, 60000); // Every minute
};

/**
 * Database metrics collection
 */
const collectDatabaseMetrics = () => {
  // This would be called from database query interceptors
  metrics.database.queries++;
};

/**
 * Cache metrics to Redis/memory
 */
const cacheMetrics = async () => {
  try {
    await cache.set('performance_metrics', metrics, 300); // 5 minutes TTL
  } catch (error) {
    console.warn('Failed to cache metrics:', error.message);
  }
};

/**
 * Get current metrics
 */
const getMetrics = async () => {
  try {
    // Try to get from cache first
    const cachedMetrics = await cache.get('performance_metrics');
    if (cachedMetrics) {
      return cachedMetrics;
    }
  } catch (error) {
    console.warn('Failed to get cached metrics:', error.message);
  }

  return metrics;
};

/**
 * Get performance summary
 */
const getPerformanceSummary = () => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  return {
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime)
    },
    requests: {
      total: metrics.requests.total,
      successful: metrics.requests.successful,
      failed: metrics.requests.failed,
      successRate: metrics.requests.total > 0 ?
        (metrics.requests.successful / metrics.requests.total * 100).toFixed(2) + '%' : '0%',
      requestsPerSecond: (metrics.requests.total / uptime).toFixed(2)
    },
    performance: {
      averageResponseTime: metrics.performance.averageResponseTime.toFixed(2) + 'ms',
      slowQueries: metrics.performance.slowQueries.length,
      memoryUsage: {
        current: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
        total: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
        external: (memUsage.external / 1024 / 1024).toFixed(2) + 'MB'
      }
    },
    errors: {
      total: metrics.errors.total,
      errorRate: metrics.requests.total > 0 ?
        (metrics.errors.total / metrics.requests.total * 100).toFixed(2) + '%' : '0%',
      recentErrors: metrics.errors.recent.length
    },
    database: {
      queries: metrics.database.queries,
      slowQueries: metrics.database.slowQueries
    }
  };
};

/**
 * Health check endpoint data
 */
const getHealthCheck = async () => {
  const summary = getPerformanceSummary();
  const memUsage = process.memoryUsage();

  // Determine health status
  let status = 'healthy';
  const issues = [];

  // Check memory usage (alert if > 512MB)
  if (memUsage.heapUsed > 512 * 1024 * 1024) {
    status = 'warning';
    issues.push('High memory usage');
  }

  // Check error rate (alert if > 5%)
  const errorRate = metrics.requests.total > 0 ?
    (metrics.errors.total / metrics.requests.total * 100) : 0;
  if (errorRate > 5) {
    status = 'unhealthy';
    issues.push('High error rate');
  }

  // Check average response time (alert if > 2000ms)
  if (metrics.performance.averageResponseTime > 2000) {
    status = 'warning';
    issues.push('Slow response times');
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: summary.uptime,
    performance: summary.performance,
    issues: issues.length > 0 ? issues : undefined
  };
};

/**
 * Reset metrics
 */
const resetMetrics = () => {
  metrics.requests = {
    total: 0,
    successful: 0,
    failed: 0,
    byMethod: {},
    byRoute: {},
    byStatusCode: {}
  };
  metrics.performance.averageResponseTime = 0;
  metrics.performance.slowQueries = [];
  metrics.errors = {
    total: 0,
    byType: {},
    recent: []
  };
  metrics.database = {
    queries: 0,
    slowQueries: 0,
    connections: 0
  };
};

/**
 * Utility functions
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

/**
 * Performance alerts
 */
const performanceAlerts = {
  thresholds: {
    responseTime: 2000, // 2 seconds
    memoryUsage: 512 * 1024 * 1024, // 512MB
    errorRate: 5, // 5%
    slowQueryCount: 10
  },

  checkAlerts() {
    const alerts = [];
    const memUsage = process.memoryUsage();

    // Check response time
    if (metrics.performance.averageResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE_TIME',
        value: metrics.performance.averageResponseTime,
        threshold: this.thresholds.responseTime,
        message: `Average response time is ${metrics.performance.averageResponseTime.toFixed(2)}ms`
      });
    }

    // Check memory usage
    if (memUsage.heapUsed > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        value: memUsage.heapUsed,
        threshold: this.thresholds.memoryUsage,
        message: `Memory usage is ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Check error rate
    const errorRate = metrics.requests.total > 0 ?
      (metrics.errors.total / metrics.requests.total * 100) : 0;
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        value: errorRate,
        threshold: this.thresholds.errorRate,
        message: `Error rate is ${errorRate.toFixed(2)}%`
      });
    }

    // Check slow queries
    if (metrics.performance.slowQueries.length > this.thresholds.slowQueryCount) {
      alerts.push({
        type: 'TOO_MANY_SLOW_QUERIES',
        value: metrics.performance.slowQueries.length,
        threshold: this.thresholds.slowQueryCount,
        message: `${metrics.performance.slowQueries.length} slow queries detected`
      });
    }

    return alerts;
  }
};

// Initialize system metrics collection
collectSystemMetrics();

module.exports = {
  performanceMonitor,
  errorTracker,
  collectDatabaseMetrics,
  getMetrics,
  getPerformanceSummary,
  getHealthCheck,
  resetMetrics,
  performanceAlerts,
  cacheMetrics
};
