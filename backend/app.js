/**
 * Main Express Application
 * Supermarket Inventory & Sales Management System
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { logger } = require('./src/utils/logger');
require('dotenv').config();

// Import demo configuration
const DEMO_CONFIG = require('./src/config/demo');

// Import middleware
const {
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
  corsOptions
} = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportsRoutes = require('./src/routes/reportsRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const masterDataRoutes = require('./src/routes/masterDataRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');
const financialRoutes = require('./src/routes/financialRoutes');
const securityRoutes = require('./src/routes/securityRoutes');
const emailRoutes = require('./src/routes/emailRoutes');

// Import database connection
const mongoose = require('mongoose');

// Initialize Express app
const app = express();

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('✅ Connected to MongoDB Atlas'))
  .catch((err) => logger.error('❌ MongoDB connection failed', { error: err.message }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Custom security headers
app.use(securityHeaders);

// Rate limiting (disabled in demo mode for better UX)
if (!DEMO_CONFIG.demoMode && DEMO_CONFIG.performance.rateLimitEnabled !== false) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/', limiter);
} else {
  logger.info('🔓 Rate limiting disabled for demo mode');
}

// Stricter rate limiting for auth endpoints (also disabled in demo mode)
if (!DEMO_CONFIG.demoMode && DEMO_CONFIG.performance.rateLimitEnabled !== false) {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
      success: false,
      message: 'Too many login attempts, please try again later.',
      timestamp: new Date().toISOString()
    },
    skipSuccessfulRequests: true
  });

  app.use('/api/auth/login', authLimiter);
} else {
  logger.info('🔓 Auth rate limiting disabled for demo mode');
}

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Health check endpoint (with rate limiting for testing)
const healthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

app.get('/health', healthLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    demoMode: DEMO_CONFIG.demoMode
  });
});

// Demo configuration endpoint for frontend
app.get('/api/demo/config', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Demo configuration retrieved',
    data: {
      demoMode: DEMO_CONFIG.demoMode,
      features: DEMO_CONFIG.features,
      sampleData: {
        enabled: DEMO_CONFIG.sampleData.enabled,
        productCount: DEMO_CONFIG.sampleData.productCount,
        transactionDays: DEMO_CONFIG.sampleData.transactionDays
      },
      demoUsers: DEMO_CONFIG.demoUsers.map(user => ({
        email: user.email,
        role: user.role,
        name: user.name
        // Don't expose passwords
      })),
      api: DEMO_CONFIG.api
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/email', emailRoutes);

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
      inventory: '/api/inventory',
      masterData: '/api/master-data',
      purchases: '/api/purchases',
      financial: '/api/financial',
      security: '/api/security',
      email: '/api/email'
    },
    docs: 'https://documenter.getpostman.com/view/your-docs',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 API Base URL: http://localhost:${PORT}`);
    logger.info(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/overview`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

module.exports = app;
