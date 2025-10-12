/**
 * Demo Configuration for Frontend-Backend Integration
 * This file contains settings to make the application demo-ready
 */

const DEMO_CONFIG = {
  // Demo mode settings
  demoMode: process.env.DEMO_MODE === 'true',

  // Sample data settings
  sampleData: {
    enabled: true,
    productCount: 1200,
    transactionDays: 60,
    salesCount: 500,
    purchasesCount: 250,
    transfersCount: 45,
    adjustmentsCount: 35
  },

  // Frontend integration
  frontend: {
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    enabled: true,
    corsOrigins: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ]
  },

  // Demo users (automatically created during seeding)
  demoUsers: [
    {
      email: 'admin@supermarket.com',
      password: 'Admin@123456',
      role: 'admin',
      name: 'System Administrator'
    },
    {
      email: 'manager@supermarket.com',
      password: 'Manager@123456',
      role: 'manager',
      name: 'Store Manager'
    },
    {
      email: 'cashier@supermarket.com',
      password: 'Cashier@123456',
      role: 'cashier',
      name: 'POS Operator'
    }
  ],

  // Database settings for demo
  database: {
    dropOnSeed: process.env.NODE_ENV !== 'production',
    createIndexes: true,
    enableAuditing: true
  },

  // Performance settings for demo
  performance: {
    cacheEnabled: true,
    compressionEnabled: true,
    rateLimitEnabled: false, // Disabled for demo
    loggingLevel: 'info'
  },

  // Features enabled in demo
  features: {
    dashboard: true,
    inventory: true,
    sales: true,
    purchases: true,
    transfers: true,
    adjustments: true,
    reports: true,
    masterData: true,
    userManagement: true,
    auditLogs: true
  },

  // API response settings
  api: {
    includeTimestamps: true,
    includeMeta: true,
    defaultPageSize: 20,
    maxPageSize: 100
  }
};

module.exports = DEMO_CONFIG;
