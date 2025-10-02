#!/usr/bin/env node

/**
 * Quick demo data verification script
 * Shows what data has been successfully seeded
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const Supplier = require('../models/Supplier');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supermarket');
    console.log('✅ Connected to MongoDB');

    // Get counts
    const counts = {
      users: await User.countDocuments(),
      categories: await Category.countDocuments(),
      brands: await Brand.countDocuments(),
      units: await Unit.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      branches: await Branch.countDocuments(),
      products: await Product.countDocuments(),
      customers: await Customer.countDocuments()
    };

    console.log('\n🎯 DEMO DATA SUMMARY');
    console.log('===================');
    console.log(`Users: ${counts.users}`);
    console.log(`Categories: ${counts.categories}`);
    console.log(`Brands: ${counts.brands}`);
    console.log(`Units: ${counts.units}`);
    console.log(`Suppliers: ${counts.suppliers}`);
    console.log(`Branches: ${counts.branches}`);
    console.log(`Products: ${counts.products} ⭐`);
    console.log(`Customers: ${counts.customers}`);
    console.log('===================');
    
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`Total Records: ${totalRecords}`);

    // Show sample data
    console.log('\n📊 SAMPLE DATA');
    console.log('==============');
    
    // Sample products
    const sampleProducts = await Product.find({})
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('unit', 'name')
      .limit(5);
      
    console.log('\n🛍️ Sample Products:');
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Category: ${product.category?.name}`);
      console.log(`   Brand: ${product.brand?.name}`);
      console.log(`   Price: ₹${product.pricing?.sellingPrice}`);
      console.log(`   Stock: ${product.stockByBranch?.length || 0} branches`);
      console.log('');
    });

    // Login credentials
    console.log('\n🔐 LOGIN CREDENTIALS');
    console.log('====================');
    console.log('Admin: admin@supermarket.com / Admin@123456');
    console.log('Manager: manager@supermarket.com / Manager@123456');
    console.log('Cashier: cashier1@supermarket.com / Cashier@123456');
    console.log('Cashier: cashier2@supermarket.com / Cashier@123456');
    console.log('Inventory: inventory@supermarket.com / Inventory@123456');

    console.log('\n✅ Demo data ready! You can now test the frontend and backend.');
    console.log('🚀 Start the backend: npm run dev');
    console.log('🌐 Start the frontend: cd ../frontend && npm run dev');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

main();