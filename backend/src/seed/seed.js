#!/usr/bin/env node

/**
 * Main seeding script for Indian Supermarket Inventory System
 * Creates comprehensive demo data with 1000+ products
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DatabaseSeeder = require('./utils/DatabaseSeeder');

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supermarket', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Initialize seeder
    const seeder = new DatabaseSeeder();
    
    // Run seeding
    await seeder.seedAll();
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('🔐 Default login credentials:');
    console.log('   Admin: admin@supermarket.com / Admin@123456');
    console.log('   Manager: manager@supermarket.com / Manager@123456');
    console.log('   Cashier: cashier1@supermarket.com / Cashier@123456');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌱 Indian Supermarket Seeding Script

Usage: node seed.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  MONGODB_URI    MongoDB connection string (default: mongodb://localhost:27017/supermarket)

What this script does:
- Creates 5 demo users (admin, manager, cashiers)
- Sets up 12 product categories with Indian market focus
- Adds 30+ brands (Indian & International)
- Creates 8 measurement units
- Adds 8 suppliers across major Indian cities
- Sets up 8 branch locations
- Generates 1200+ realistic products with Indian names
- Creates 150 customers
- Generates 50 purchase orders
- Creates 200 sales transactions

🎯 Perfect for testing dashboards, reports, and full system functionality!
  `);
  process.exit(0);
}

// Run the seeder
main();