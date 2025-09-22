/**
 * Main Express Application
 * Supermarket Inventory & Sales Management System
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import middleware
const { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  securityHeaders,
  corsOptions 
} = require('./src/middleware/errorHandler');
const { auditMiddleware } = require('./src/middleware/auditLogger');
const { sanitizeInput } = require('./src/middleware/inputSanitizer');
const { specs, swaggerUi, setup } = require('./src/config/swagger');
const { initRedis, cache } = require('./src/config/cache');
const { optimizeConnection, createIndexes, performanceMonitor } = require('./src/utils/dbOptimization');
const { performanceMonitor: perfMonitor, errorTracker, getHealthCheck, getPerformanceSummary } = require('./src/middleware/performanceMonitor');
const { general: generalRateLimit, dynamicRateLimit } = require('./src/middleware/advancedRateLimit');
const { warmUpCache } = require('./src/middleware/cache');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportsRoutes = require('./src/routes/reportsRoutes');
const masterDataRoutes = require('./src/routes/masterDataRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
// const purchaseRoutes = require('./src/routes/purchaseRoutes');
const financialRoutes = require('./src/routes/financialRoutes');
const securityRoutes = require('./src/routes/securityRoutes');

// Import database connection
const mongoose = require('mongoose');

// Initialize Express app
const app = express();

// Optimize database connection
optimizeConnection();

// Connect to database with optimized options
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
})
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create database indexes for performance
    await createIndexes();
    
    // Initialize Redis and cache
    await initRedis();
    
    // Warm up cache with common data
    await warmUpCache();
    
    // Enable performance monitoring
    if (process.env.NODE_ENV === 'development') {
      performanceMonitor.enableSlowQueryLogging();
    }
  })
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Custom security headers
app.use(securityHeaders);

// Performance monitoring
app.use(perfMonitor);

// Rate limiting
app.use('/api/', generalRateLimit);

// Dynamic rate limiting based on user role (will be applied after authentication)
// app.use('/api/', dynamicRateLimit); // Temporarily disabled to fix double count issue

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(sanitizeInput({
  maxStringLength: 10000,
  strictMode: false
}));

// Audit logging middleware - temporarily disabled for debugging
// app.use(auditMiddleware({
//   skipRoutes: ['/health', '/api/auth/refresh'],
//   skipMethods: []
// }));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthData = await getHealthCheck();
  const statusCode = healthData.status === 'healthy' ? 200 : 
                    healthData.status === 'warning' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    health: healthData
  });
});

// Performance metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const summary = getPerformanceSummary();
    const cacheStats = cache.getStats();
    
    res.json({
      success: true,
      data: {
        performance: summary,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, setup);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/inventory', inventoryRoutes);
// app.use('/api/purchases', purchaseRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/security', securityRoutes);

// System monitoring and health check endpoints
app.get('/health', getHealthCheck);

app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'connected',
      redis: 'connected',
      filesystem: 'accessible'
    }
  });
});

app.get('/api/system/performance', getPerformanceSummary);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Supermarket Inventory & Sales Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      masterData: '/api/master-data',
      inventory: '/api/inventory',
      purchases: '/api/purchases',
      financial: '/api/financial',
      security: '/api/security'
    },
    docs: 'https://documenter.getpostman.com/view/your-docs',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error tracking middleware
app.use(errorTracker);

// Global error handler - must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📝 Environment: ${process.env.NODE_ENV || 'development'}
🌐 API Base URL: http://localhost:${PORT}
� API Documentation: http://localhost:${PORT}/api-docs
�📊 Dashboard: http://localhost:${PORT}/api/dashboard/overview
🏥 Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
