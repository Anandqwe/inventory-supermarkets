/**
 * Database Seeding Script
 * Creates initial admin user and sample data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Branch = require('../src/models/Branch');

// Sample data
const sampleProducts = [
  // Dairy Products
  {
    name: 'Amul Milk (1L)',
    category: 'Dairy',
    subcategory: 'milk',
    brand: 'Amul',
    sku: 'AMUL001',
    barcode: '8901030819197',
    price: 65,
    costPrice: 55,
    quantity: 150,
    unit: 'l',
    minStockLevel: 20,
    maxStockLevel: 200,
    supplier: 'Amul Dairy',
    gstRate: 5,
    description: 'Fresh full cream milk from Amul'
  },
  {
    name: 'Britannia Bread (400g)',
    category: 'Bakery',
    subcategory: 'bread',
    brand: 'Britannia',
    sku: 'BRIT001',
    barcode: '8901030819198',
    price: 35,
    costPrice: 28,
    quantity: 80,
    unit: 'piece',
    minStockLevel: 10,
    maxStockLevel: 100,
    supplier: 'Britannia Industries',
    gstRate: 5,
    description: 'Soft and fresh white bread'
  },
  // Rice & Grains
  {
    name: 'Basmati Rice (5kg)',
    category: 'Grains',
    subcategory: 'rice',
    brand: 'India Gate',
    sku: 'IG001',
    barcode: '8901030819199',
    price: 450,
    costPrice: 380,
    quantity: 50,
    unit: 'kg',
    minStockLevel: 5,
    maxStockLevel: 100,
    supplier: 'KRBL Limited',
    gstRate: 5,
    description: 'Premium quality basmati rice'
  },
  // Cooking Oil
  {
    name: 'Fortune Sunflower Oil (1L)',
    category: 'Pantry',
    subcategory: 'cooking-oil',
    brand: 'Fortune',
    sku: 'FORT001',
    barcode: '8901030819200',
    price: 135,
    costPrice: 115,
    quantity: 75,
    unit: 'l',
    minStockLevel: 10,
    maxStockLevel: 150,
    supplier: 'Adani Wilmar',
    gstRate: 5,
    description: 'Refined sunflower oil for cooking'
  },
  // Beverages
  {
    name: 'Coca Cola (2L)',
    category: 'Beverages',
    subcategory: 'soft-drinks',
    brand: 'Coca-Cola',
    sku: 'COKE001',
    barcode: '8901030819201',
    price: 85,
    costPrice: 70,
    quantity: 120,
    unit: 'piece',
    minStockLevel: 15,
    maxStockLevel: 200,
    supplier: 'Coca-Cola India',
    gstRate: 28,
    description: 'Refreshing cola drink'
  },
  // Snacks
  {
    name: 'Lays Chips (90g)',
    category: 'Snacks',
    subcategory: 'chips',
    brand: 'Lays',
    sku: 'LAYS001',
    barcode: '8901030819202',
    price: 20,
    costPrice: 15,
    quantity: 200,
    unit: 'piece',
    minStockLevel: 25,
    maxStockLevel: 300,
    supplier: 'PepsiCo India',
    gstRate: 18,
    description: 'Crispy potato chips'
  },
  // Cleaning Products
  {
    name: 'Surf Excel Detergent (1kg)',
    category: 'Household',
    subcategory: 'detergent',
    brand: 'Surf Excel',
    sku: 'SURF001',
    barcode: '8901030819203',
    price: 180,
    costPrice: 150,
    quantity: 60,
    unit: 'kg',
    minStockLevel: 8,
    maxStockLevel: 100,
    supplier: 'Hindustan Unilever',
    gstRate: 28,
    description: 'Advanced stain removal detergent powder'
  },
  // Personal Care
  {
    name: 'Colgate Toothpaste (200g)',
    category: 'Personal Care',
    subcategory: 'oral-care',
    brand: 'Colgate',
    sku: 'COLG001',
    barcode: '8901030819204',
    price: 95,
    costPrice: 75,
    quantity: 100,
    unit: 'piece',
    minStockLevel: 15,
    maxStockLevel: 150,
    supplier: 'Colgate-Palmolive',
    gstRate: 18,
    description: 'Complete cavity protection toothpaste'
  },
  // Low stock item for testing alerts
  {
    name: 'Maggi Noodles (70g)',
    category: 'Snacks',
    subcategory: 'instant-noodles',
    brand: 'Maggi',
    sku: 'MAGG001',
    barcode: '8901030819205',
    price: 14,
    costPrice: 11,
    quantity: 5, // Low stock to trigger alert
    unit: 'piece',
    minStockLevel: 20,
    maxStockLevel: 200,
    supplier: 'Nestle India',
    gstRate: 18,
    description: '2-minute instant noodles'
  },
  // Out of stock item for testing
  {
    name: 'Tata Salt (1kg)',
    category: 'Pantry',
    subcategory: 'salt',
    brand: 'Tata',
    sku: 'TATA001',
    barcode: '8901030819206',
    price: 22,
    costPrice: 18,
    quantity: 0, // Out of stock
    unit: 'kg',
    minStockLevel: 10,
    maxStockLevel: 100,
    supplier: 'Tata Consumer Products',
    gstRate: 5,
    description: 'Refined iodized salt'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Branch.deleteMany({});
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      email: 'admin@supermarket.com',
      password: 'Admin@123456', // The pre-save hook will hash this
      firstName: 'System',
      lastName: 'Administrator',
      role: 'Admin',
      phone: '9999999999',
      isActive: true
    });
    
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);
    
    // Create main branch
    console.log('🏢 Creating main branch...');
    const mainBranch = new Branch({
      name: 'Main Store',
      code: 'MAIN01',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      contact: {
        phone: '022-12345678',
        email: 'main@supermarket.com'
      },
      isActive: true,
      createdBy: adminUser._id
    });
    
    await mainBranch.save();
    console.log('✅ Main branch created:', mainBranch.name);
    
    // Create manager user
    console.log('👤 Creating manager user...');
    const managerUser = new User({
      email: 'manager@supermarket.com',
      password: 'Manager@123456', // The pre-save hook will hash this
      firstName: 'Store',
      lastName: 'Manager',
      role: 'Manager',
      branch: mainBranch._id,
      phone: '9999999998',
      isActive: true,
      createdBy: adminUser._id
    });
    
    await managerUser.save();
    console.log('✅ Manager user created:', managerUser.email);
    
    // Create cashier user
    console.log('👤 Creating cashier user...');
    const cashierUser = new User({
      email: 'cashier@supermarket.com',
      password: 'Cashier@123456', // The pre-save hook will hash this
      firstName: 'Store',
      lastName: 'Cashier',
      role: 'Cashier',
      branch: mainBranch._id,
      phone: '9999999997',
      isActive: true,
      createdBy: adminUser._id
    });
    
    await cashierUser.save();
    console.log('✅ Cashier user created:', cashierUser.email);
    
    // Add createdBy and updatedBy to products
    const productsWithUser = sampleProducts.map(product => ({
      ...product,
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    }));
    
    // Create sample products
    console.log('📦 Creating sample products...');
    await Product.insertMany(productsWithUser);
    console.log(`✅ ${sampleProducts.length} products created`);
    
    // Display summary
    console.log('\n📊 Database seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@supermarket.com / Admin@123456');
    console.log('Manager: manager@supermarket.com / Manager@123456');
    console.log('Cashier: cashier@supermarket.com / Cashier@123456');
    
    console.log('\n📈 Database Summary:');
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ 
      $expr: { $lte: ['$quantity', '$minStockLevel'] } 
    });
    
    console.log(`Users: ${userCount}`);
    console.log(`Products: ${productCount}`);
    console.log(`Low Stock Items: ${lowStockCount}`);
    
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
