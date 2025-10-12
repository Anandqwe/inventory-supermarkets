const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Database connection configuration
 */
class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
      };

      this.connection = await mongoose.connect(process.env.MONGODB_URI, options);

      logger.info('✅ Connected to MongoDB Atlas');
      logger.info(`📊 Database: ${this.connection.connection.name}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.info('📡 MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', this.disconnect.bind(this));
      process.on('SIGTERM', this.disconnect.bind(this));

      return this.connection;
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('📡 MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error closing database connection', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      state: states[mongoose.connection.readyState],
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  }

  /**
   * Check if database is healthy
   */
  async healthCheck() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return { healthy: false, message: 'Database not connected' };
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();

      return {
        healthy: true,
        message: 'Database connection healthy',
        ...this.getStatus()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database health check failed: ${error.message}`
      };
    }
  }
}

module.exports = new Database();
