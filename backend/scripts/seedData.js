/**
 * Database Seeding Script
 * Creates initial admin user only (no sample products)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const seedDatabase = async () => {
  try {
    console.log('🗄️ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`Email: ${existingAdmin.email}`);
      process.exit(0);
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@supermarket.com',
      password: 'Admin@123456', // Raw password - will be hashed by pre-save hook
      role: 'Admin',
      permissions: [
        'manage_products', 'view_products',
        'make_sales', 'view_sales', 
        'manage_inventory', 'view_inventory',
        'view_reports', 'manage_reports',
        'manage_users', 'view_users',
        'manage_settings', 'view_settings',
        'manage_categories', 'view_categories',
        'manage_brands', 'view_brands',
        'manage_units', 'view_units',
        'manage_suppliers', 'view_suppliers',
        'manage_branches', 'view_branches'
      ],
      isActive: true
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Login credentials:');
    console.log('Email: admin@supermarket.com');
    console.log('Password: Admin@123456');

    // Summary
    console.log('\n📊 Database seeding completed:');
    const userCount = await User.countDocuments();
    console.log(`Users: ${userCount}`);
    console.log('Products: 0 (cleaned - no sample data)');
    console.log('Ready for fresh data entry!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
