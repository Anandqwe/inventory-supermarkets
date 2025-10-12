require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../src/models/Branch');
const User = require('../src/models/User');

/**
 * Seed 3 Mumbai Branches - Mumbai Supermart Chain
 * Locations: Andheri West (Flagship), Vile Parle East (Express), Bandra West (Premium)
 */

const mumbaiBranches = [
  {
    name: 'Mumbai Supermart - Andheri West',
    code: 'AW001',
    address: {
      street: 'Shop No. 15-18, Link Road',
      area: 'Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      country: 'India',
      landmark: 'Near Infinity Mall'
    },
    contact: {
      phone: '+91 22 2673 4567',
      alternatePhone: '+91 22 2673 4568',
      email: 'andheri@mumbaisupermart.com',
      whatsapp: '+91 98765 43210'
    },
    type: 'flagship',
    description: 'Our flagship store in Andheri West offering complete range of products including grocery, fresh produce, personal care, and household items. Open from 8 AM to 11 PM daily.',
    area: 3000, // sq ft
    openingTime: '08:00',
    closingTime: '23:00',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    isActive: true,
    isPrimary: true, // This is the main branch
    settings: {
      enableInventory: true,
      enableSales: true,
      enablePurchase: true,
      enableTransfers: true,
      autoReorder: true,
      reorderBuffer: 10, // days
      lowStockThreshold: 15,
      printReceipt: true,
      sendSMSOnSale: false
    },
    bankDetails: {
      accountName: 'Mumbai Supermart - Andheri',
      accountNumber: '1234567890',
      bankName: 'HDFC Bank',
      branch: 'Andheri West',
      ifscCode: 'HDFC0001234',
      upiId: 'mumbaisupermart.andheri@hdfcbank'
    },
    gstNumber: 'GSTMAH001AW',
    panNumber: 'AAACM1234A',
    features: ['Full Product Range', 'Home Delivery', 'Online Ordering', 'Parking Available', 'AC Store'],
    images: [],
    metadata: {
      storeManager: null, // Will be set after user creation
      inventoryManager: null, // Will be set after user creation
      totalStaff: 12,
      parkingSpots: 20,
      deliveryRadius: 5 // km
    }
  },
  {
    name: 'Mumbai Supermart - Vile Parle East',
    code: 'VP002',
    address: {
      street: 'Ground Floor, Nehru Road',
      area: 'Vile Parle East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400057',
      country: 'India',
      landmark: 'Opposite Railway Station'
    },
    contact: {
      phone: '+91 22 2616 7890',
      alternatePhone: '+91 22 2616 7891',
      email: 'vileparle@mumbaisupermart.com',
      whatsapp: '+91 98765 43211'
    },
    type: 'express',
    description: 'Express store in Vile Parle East focusing on daily essentials, dairy, snacks, beverages, and personal care. Perfect for quick shopping near the railway station. Open from 7 AM to 10 PM.',
    area: 1500, // sq ft
    openingTime: '07:00',
    closingTime: '22:00',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    isActive: true,
    isPrimary: false,
    settings: {
      enableInventory: true,
      enableSales: true,
      enablePurchase: true,
      enableTransfers: true,
      autoReorder: true,
      reorderBuffer: 7, // days
      lowStockThreshold: 10,
      printReceipt: true,
      sendSMSOnSale: false
    },
    bankDetails: {
      accountName: 'Mumbai Supermart - Vile Parle',
      accountNumber: '1234567891',
      bankName: 'HDFC Bank',
      branch: 'Vile Parle',
      ifscCode: 'HDFC0001235',
      upiId: 'mumbaisupermart.vileparle@hdfcbank'
    },
    gstNumber: 'GSTMAH002VP',
    panNumber: 'AAACM1234A',
    features: ['Daily Essentials', 'Quick Checkout', 'Early Opening', 'Near Railway Station'],
    images: [],
    metadata: {
      storeManager: null,
      inventoryManager: null,
      totalStaff: 8,
      parkingSpots: 0,
      deliveryRadius: 3 // km
    }
  },
  {
    name: 'Mumbai Supermart - Bandra West',
    code: 'BW003',
    address: {
      street: 'Shop 5-8, Turner Road',
      area: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      country: 'India',
      landmark: 'Near Bandra Bandstand'
    },
    contact: {
      phone: '+91 22 2640 5678',
      alternatePhone: '+91 22 2640 5679',
      email: 'bandra@mumbaisupermart.com',
      whatsapp: '+91 98765 43212'
    },
    type: 'premium',
    description: 'Premium store in Bandra West featuring imported products, organic items, gourmet foods, and specialty products. Curated selection for discerning customers. Open from 9 AM to 11 PM.',
    area: 2500, // sq ft
    openingTime: '09:00',
    closingTime: '23:00',
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    isActive: true,
    isPrimary: false,
    settings: {
      enableInventory: true,
      enableSales: true,
      enablePurchase: true,
      enableTransfers: true,
      autoReorder: true,
      reorderBuffer: 12, // days
      lowStockThreshold: 20,
      printReceipt: true,
      sendSMSOnSale: true
    },
    bankDetails: {
      accountName: 'Mumbai Supermart - Bandra',
      accountNumber: '1234567892',
      bankName: 'HDFC Bank',
      branch: 'Bandra West',
      ifscCode: 'HDFC0001236',
      upiId: 'mumbaisupermart.bandra@hdfcbank'
    },
    gstNumber: 'GSTMAH003BW',
    panNumber: 'AAACM1234A',
    features: ['Premium Products', 'Organic Range', 'Imported Items', 'Gourmet Selection', 'Gift Hampers', 'AC Store'],
    images: [],
    metadata: {
      storeManager: null,
      inventoryManager: null,
      totalStaff: 10,
      parkingSpots: 15,
      deliveryRadius: 7 // km
    }
  }
];

const seedMumbaiBranches = async () => {
  try {
    console.log('🏢 Starting Mumbai Branches Seed...\n');

    // Check if branches already exist
    const existingBranches = await Branch.find();
    if (existingBranches.length > 0) {
      console.log('⚠️  Warning: Branches already exist in database');
      console.log(`📊 Found ${existingBranches.length} existing branches`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('\n❓ Do you want to DELETE all existing branches and create new ones? (yes/no): ', resolve);
      });

      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Seeding cancelled by user');
        process.exit(0);
      }

      // Delete all existing branches
      console.log('\n🗑️  Deleting all existing branches...');
      const deleteResult = await Branch.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} branches\n`);
    }

    // Get or create a system user for createdBy
    let systemUser = await User.findOne({ role: 'Admin' }).limit(1);

    if (!systemUser) {
      console.log('⚠️  No admin user found, creating temporary system user...');
      const bcrypt = require('bcryptjs');
      systemUser = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'system@mumbaisupermart.com',
        password: await bcrypt.hash('System@123456', 10),
        role: 'Admin',
        isActive: true
      });
      console.log('✅ Created system admin user\n');
    }

    console.log(`👤 Using admin: ${systemUser.email} for createdBy field\n`);

    // Create new Mumbai branches
    console.log('📝 Creating 3 Mumbai branches...\n');

    const createdBranches = [];
    for (const branchData of mumbaiBranches) {
      // Add createdBy field
      branchData.createdBy = systemUser._id;

      const branch = await Branch.create(branchData);
      createdBranches.push(branch);

      console.log(`✅ Created: ${branch.name}`);
      console.log(`   Code: ${branch.code}`);
      console.log(`   City: ${branch.address.city}, ${branch.address.state}`);
      console.log(`   PIN: ${branch.address.pincode}`);
      console.log(`   Phone: ${branch.contact.phone}`);
      console.log(`   Email: ${branch.contact.email}`);
      console.log('');
    }

    console.log('📊 Summary:');
    console.log(`   Total Branches Created: ${createdBranches.length}`);
    console.log('   All branches in Mumbai, Maharashtra');
    console.log('');

    console.log('🎉 Mumbai Branches Seeding Completed Successfully!');
    console.log('');
    console.log('📍 Branch Details:');
    console.log(`   1. Andheri West (AW001) - ${createdBranches[0].address.pincode}`);
    console.log(`   2. Vile Parle East (VP002) - ${createdBranches[1].address.pincode}`);
    console.log(`   3. Bandra West (BW003) - ${createdBranches[2].address.pincode}`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Run npm run seed:users to create staff for these branches');
    console.log('   2. Run seedProductsRealistic.js to add products');
    console.log('   3. Run seedInventoryDistributed.js to distribute stock');

    return createdBranches;

  } catch (error) {
    console.error('❌ Error seeding Mumbai branches:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  const database = require('../src/config/database');

  database.connect()
    .then(async () => {
      await seedMumbaiBranches();
      console.log('\n✅ Database connection will close in 2 seconds...');
      setTimeout(() => {
        mongoose.connection.close();
        process.exit(0);
      }, 2000);
    })
    .catch(error => {
      console.error('❌ Database connection error:', error);
      process.exit(1);
    });
}

module.exports = seedMumbaiBranches;
