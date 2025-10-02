#!/usr/bin/env node

/**
 * Database wipe script - DANGEROUS! Development only!
 * Completely clears all data and optionally reseeds
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DatabaseSeeder = require('./utils/DatabaseSeeder');

// Models to clear
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const Supplier = require('../models/Supplier');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Adjustment = require('../models/Adjustment');

async function wipeDatabase() {
  console.log('🗑️  WIPING DATABASE - This will delete ALL data!');
  
  try {
    // Clear all collections
    await Adjustment.deleteMany({});
    await Transfer.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Branch.deleteMany({});
    await Supplier.deleteMany({});
    await Unit.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    
    console.log('✅ Database wiped clean');
    
    // Get counts to verify
    const counts = {
      users: await User.countDocuments(),
      categories: await Category.countDocuments(),
      brands: await Brand.countDocuments(),
      units: await Unit.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      branches: await Branch.countDocuments(),
      products: await Product.countDocuments(),
      customers: await Customer.countDocuments(),
      sales: await Sale.countDocuments(),
      purchases: await Purchase.countDocuments(),
      transfers: await Transfer.countDocuments(),
      adjustments: await Adjustment.countDocuments()
    };
    
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`📊 Remaining records: ${totalRecords}`);
    
    if (totalRecords > 0) {
      console.log('⚠️  Warning: Some records may not have been deleted');
      Object.entries(counts).forEach(([collection, count]) => {
        if (count > 0) {
          console.log(`  ${collection}: ${count} remaining`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error wiping database:', error);
    throw error;
  }
}

async function main() {
  try {
    // Safety checks
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ CANNOT RUN IN PRODUCTION!');
      process.exit(1);
    }
    
    const args = process.argv.slice(2);
    const shouldReseed = args.includes('--reseed');
    const force = args.includes('--force');
    
    if (!force) {
      console.log('⚠️  This will PERMANENTLY DELETE ALL DATA!');
      console.log('   Add --force flag to confirm you want to proceed');
      console.log('   Add --reseed flag to automatically reseed after wipe');
      console.log('');
      console.log('Usage: npm run seed:wipe -- --force [--reseed]');
      process.exit(1);
    }
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supermarket');
    console.log('✅ Connected to MongoDB');
    
    // Wipe database
    await wipeDatabase();
    
    // Optionally reseed
    if (shouldReseed) {
      console.log('\n🌱 Reseeding database...');
      const seeder = new DatabaseSeeder();
      await seeder.seedAll();
      console.log('✅ Database reseeded successfully!');
    }
    
    console.log('\n🎯 Database wipe completed!');
    
  } catch (error) {
    console.error('❌ Wipe failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🗑️  Database Wipe Script (DANGEROUS!)

Usage: npm run seed:wipe -- --force [options]

Options:
  --force        Required flag to confirm you want to wipe all data
  --reseed       Automatically reseed database after wiping
  --help, -h     Show this help message

Examples:
  npm run seed:wipe -- --force                    # Wipe only
  npm run seed:wipe -- --force --reseed           # Wipe and reseed
  
⚠️  WARNING: This will permanently delete ALL data!
⚠️  Only works in development (NODE_ENV !== 'production')
  `);
  process.exit(0);
}

// Run the wiper
main();