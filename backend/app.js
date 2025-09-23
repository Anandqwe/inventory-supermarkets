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
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    timestamp: new Date().toISOString()
  },
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
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

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📝 Environment: ${process.env.NODE_ENV || 'development'}
🌐 API Base URL: http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}/api/dashboard/overview
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
