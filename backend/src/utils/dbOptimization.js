const mongoose = require('mongoose');

/**
 * Database optimization utilities and configurations
 */

/**
 * Database connection optimization
 */
const optimizeConnection = () => {
  // Set mongoose global options that are valid
  mongoose.set('strictQuery', false); // Prepare for Mongoose 7

  // Connection event handlers
  mongoose.connection.on('connected', () => {
    console.log('📊 Database connection optimized');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Database connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected');
  });
};

/**
 * Create database indexes for optimal performance
 */
const createIndexes = async () => {
  try {
    console.log('🔍 Creating database indexes...');

    // User indexes
    const User = require('../models/User');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ branchId: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ createdAt: -1 });

    // Product indexes
    const Product = require('../models/Product');
    await Product.collection.createIndex({ sku: 1 }, { unique: true });
    await Product.collection.createIndex({ name: 'text', description: 'text' });
    await Product.collection.createIndex({ categoryId: 1 });
    await Product.collection.createIndex({ brandId: 1 });
    await Product.collection.createIndex({ isActive: 1 });
    await Product.collection.createIndex({ stockQuantity: 1 });
    await Product.collection.createIndex({ price: 1 });
    await Product.collection.createIndex({ createdAt: -1 });
    await Product.collection.createIndex({
      categoryId: 1,
      brandId: 1,
      isActive: 1
    }); // Compound index for filtering

    // Sale indexes
    const Sale = require('../models/Sale');
    await Sale.collection.createIndex({ receiptNumber: 1 }, { unique: true });
    await Sale.collection.createIndex({ branchId: 1 });
    await Sale.collection.createIndex({ cashierId: 1 });
    await Sale.collection.createIndex({ saleDate: -1 });
    await Sale.collection.createIndex({ status: 1 });
    await Sale.collection.createIndex({ paymentMethod: 1 });
    await Sale.collection.createIndex({
      branchId: 1,
      saleDate: -1
    }); // Compound index for branch sales queries
    await Sale.collection.createIndex({
      saleDate: -1,
      branchId: 1,
      status: 1
    }); // Compound index for analytics queries

    // Inventory indexes
    const InventoryTransaction = require('../models/InventoryTransaction');
    await InventoryTransaction.collection.createIndex({ productId: 1 });
    await InventoryTransaction.collection.createIndex({ branchId: 1 });
    await InventoryTransaction.collection.createIndex({ type: 1 });
    await InventoryTransaction.collection.createIndex({ createdAt: -1 });
    await InventoryTransaction.collection.createIndex({
      productId: 1,
      branchId: 1,
      createdAt: -1
    }); // Compound index for product history

    // Purchase Order indexes
    const PurchaseOrder = require('../models/PurchaseOrder');
    await PurchaseOrder.collection.createIndex({ orderNumber: 1 }, { unique: true });
    await PurchaseOrder.collection.createIndex({ supplierId: 1 });
    await PurchaseOrder.collection.createIndex({ branchId: 1 });
    await PurchaseOrder.collection.createIndex({ status: 1 });
    await PurchaseOrder.collection.createIndex({ orderDate: -1 });
    await PurchaseOrder.collection.createIndex({
      branchId: 1,
      status: 1,
      orderDate: -1
    }); // Compound index for order management

    // Invoice indexes
    const Invoice = require('../models/Invoice');
    await Invoice.collection.createIndex({ invoiceNumber: 1 }, { unique: true });
    await Invoice.collection.createIndex({ customerId: 1 });
    await Invoice.collection.createIndex({ branchId: 1 });
    await Invoice.collection.createIndex({ status: 1 });
    await Invoice.collection.createIndex({ issueDate: -1 });
    await Invoice.collection.createIndex({ dueDate: 1 });
    await Invoice.collection.createIndex({
      branchId: 1,
      status: 1,
      issueDate: -1
    }); // Compound index for invoice management

    // Payment indexes
    const Payment = require('../models/Payment');
    await Payment.collection.createIndex({ invoiceId: 1 });
    await Payment.collection.createIndex({ branchId: 1 });
    await Payment.collection.createIndex({ paymentDate: -1 });
    await Payment.collection.createIndex({ status: 1 });
    await Payment.collection.createIndex({ method: 1 });

    // Audit Log indexes
    const AuditLog = require('../models/AuditLog');
    await AuditLog.collection.createIndex({ userId: 1 });
    await AuditLog.collection.createIndex({ action: 1 });
    await AuditLog.collection.createIndex({ resource: 1 });
    await AuditLog.collection.createIndex({ timestamp: -1 });
    await AuditLog.collection.createIndex({ branchId: 1 });
    await AuditLog.collection.createIndex({
      userId: 1,
      timestamp: -1
    }); // Compound index for user activity
    await AuditLog.collection.createIndex({
      resource: 1,
      action: 1,
      timestamp: -1
    }); // Compound index for resource tracking

    // Master Data indexes
    const Category = require('../models/Category');
    await Category.collection.createIndex({ name: 1 }, { unique: true });
    await Category.collection.createIndex({ parentId: 1 });
    await Category.collection.createIndex({ isActive: 1 });

    const Brand = require('../models/Brand');
    await Brand.collection.createIndex({ name: 1 }, { unique: true });
    await Brand.collection.createIndex({ isActive: 1 });

    const Unit = require('../models/Unit');
    await Unit.collection.createIndex({ name: 1 }, { unique: true });
    await Unit.collection.createIndex({ symbol: 1 }, { unique: true });
    await Unit.collection.createIndex({ isActive: 1 });

    const Supplier = require('../models/Supplier');
    await Supplier.collection.createIndex({ name: 1 });
    await Supplier.collection.createIndex({ email: 1 });
    await Supplier.collection.createIndex({ isActive: 1 });

    const Branch = require('../models/Branch');
    await Branch.collection.createIndex({ name: 1 });
    await Branch.collection.createIndex({ code: 1 }, { unique: true });
    await Branch.collection.createIndex({ managerId: 1 });
    await Branch.collection.createIndex({ isActive: 1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

/**
 * Database query optimization utilities
 */
const queryOptimizer = {
  /**
   * Optimize pagination queries
   */
  paginate: (query, page = 1, limit = 10) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    return query
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for read-only operations
  },

  /**
   * Optimize aggregation pipelines
   */
  optimizeAggregation: (pipeline) => {
    // Add common optimizations
    const optimizedPipeline = [];

    // Add $match early in pipeline
    const matchIndex = pipeline.findIndex(stage => '$match' in stage);
    if (matchIndex > 0) {
      const matchStage = pipeline.splice(matchIndex, 1)[0];
      optimizedPipeline.push(matchStage);
    }

    // Add $project early to reduce data
    const projectIndex = pipeline.findIndex(stage => '$project' in stage);
    if (projectIndex > 1) {
      const projectStage = pipeline.splice(projectIndex, 1)[0];
      optimizedPipeline.splice(1, 0, projectStage);
    }

    return [...optimizedPipeline, ...pipeline];
  },

  /**
   * Add query hints for better performance
   */
  addHints: (query, hints = {}) => {
    if (hints.index) {
      query.hint(hints.index);
    }
    if (hints.sort) {
      query.sort(hints.sort);
    }
    if (hints.select) {
      query.select(hints.select);
    }
    return query;
  }
};

/**
 * Database performance monitoring
 */
const performanceMonitor = {
  /**
   * Monitor slow queries
   */
  enableSlowQueryLogging: () => {
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        const start = Date.now();
        console.log(`🔍 Query: ${collectionName}.${method}`, query);

        // Log execution time (simplified for demo)
        setTimeout(() => {
          const duration = Date.now() - start;
          if (duration > 100) { // Log queries taking more than 100ms
            console.warn(`⚠️ Slow query detected: ${duration}ms`);
          }
        }, 0);
      });
    }
  },

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();

      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        connectionStatus: mongoose.connection.readyState,
        poolSize: mongoose.connection.db.serverConfig?.poolSize || 'N/A'
      };
    } catch (error) {
      return { error: error.message };
    }
  },

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
};

/**
 * Cleanup utilities
 */
const cleanup = {
  /**
   * Clean old audit logs
   */
  async cleanOldAuditLogs(daysToKeep = 90) {
    try {
      const AuditLog = require('../models/AuditLog');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`🗑️ Cleaned ${result.deletedCount} old audit logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning audit logs:', error);
      return 0;
    }
  },

  /**
   * Archive old sales data
   */
  async archiveOldSales(monthsToKeep = 12) {
    try {
      const Sale = require('../models/Sale');
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);

      // In a real application, you might move these to an archive collection
      // For now, we'll just count them
      const count = await Sale.countDocuments({
        saleDate: { $lt: cutoffDate }
      });

      console.log(`📦 Found ${count} sales records older than ${monthsToKeep} months`);
      return count;
    } catch (error) {
      console.error('Error checking old sales:', error);
      return 0;
    }
  }
};

module.exports = {
  optimizeConnection,
  createIndexes,
  queryOptimizer,
  performanceMonitor,
  cleanup
};
