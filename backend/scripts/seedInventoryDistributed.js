const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Branch = require('../src/models/Branch');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Storage locations for inventory
const storageLocations = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8',
  'Cold Storage-1', 'Cold Storage-2', 'Cold Storage-3',
  'Display-Front', 'Display-Center', 'Display-End'
];

/**
 * Calculate inventory quantity for a product at a branch
 * based on product cost price and target inventory value
 */
function calculateQuantityForProduct(product, targetValue, isMainBranch = true) {
  const costPrice = product.pricing.costPrice;

  // For main branch (Andheri), stock all products
  // For others, stock based on popularity (higher selling price = more popular)
  if (!isMainBranch && Math.random() > 0.7) {
    // 30% chance to skip product in smaller branches
    return 0;
  }

  // Base quantity calculation
  const baseQuantity = Math.floor(targetValue / costPrice);

  // Add variance (-20% to +30%)
  const variance = 0.8 + Math.random() * 0.5;
  let quantity = Math.floor(baseQuantity * variance);

  // Ensure minimum and maximum bounds
  quantity = Math.max(5, quantity); // Minimum 5 units
  quantity = Math.min(1000, quantity); // Maximum 1000 units

  // Round to reasonable numbers based on product type
  if (costPrice < 20) {
    // Small items (snacks, etc.) - round to nearest 10
    quantity = Math.round(quantity / 10) * 10;
  } else if (costPrice < 100) {
    // Medium items - round to nearest 5
    quantity = Math.round(quantity / 5) * 5;
  } else {
    // High-value items - keep as is
    quantity = Math.round(quantity);
  }

  return quantity;
}

/**
 * Calculate reorder level based on quantity (typically 20-30% of stock)
 */
function calculateReorderLevel(quantity) {
  const percentage = 0.2 + Math.random() * 0.1; // 20-30%
  return Math.max(5, Math.floor(quantity * percentage));
}

/**
 * Calculate max stock level (typically 150-200% of current quantity)
 */
function calculateMaxStockLevel(quantity) {
  const multiplier = 1.5 + Math.random() * 0.5; // 150-200%
  return Math.ceil(quantity * multiplier);
}

// Main seed function
async function seedInventory() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    // Get system admin user
    console.log('\n👤 Finding system admin...');
    const systemUser = await User.findOne({ email: 'admin@mumbaisupermart.com' });

    if (!systemUser) {
      console.log('⚠️  System admin not found. Please run seed:users first.');
      process.exit(1);
    }

    console.log(`✅ Found system admin: ${systemUser.fullName} (${systemUser.email})`);

    // Get all branches sorted by code
    console.log('\n🏢 Finding branches...');
    const branches = await Branch.find({}).sort({ code: 1 });

    if (branches.length === 0) {
      console.log('⚠️  No branches found. Please run seed:branches first.');
      process.exit(1);
    }

    console.log(`✅ Found ${branches.length} branches:`);
    branches.forEach(branch => {
      console.log(`   - ${branch.name} (${branch.code})`);
    });

    // Get all products
    console.log('\n📦 Loading products...');
    const products = await Product.find({});

    if (products.length === 0) {
      console.log('⚠️  No products found. Please run seed:products first.');
      process.exit(1);
    }

    console.log(`✅ Found ${products.length} products`);

    // Branch inventory targets (in lakhs)
    const branchTargets = [
      { branch: branches[0], targetValue: 4500000, name: 'Andheri West', isMain: true },    // ₹45L - All products
      { branch: branches[1], targetValue: 3500000, name: 'Bandra West', isMain: false },     // ₹35L - ~70% products
      { branch: branches[2], targetValue: 1500000, name: 'Vile Parle East', isMain: false }  // ₹15L - ~50% products
    ];

    console.log('\n📊 Inventory Distribution Target:');
    console.log('   Total Target: ₹95,00,000');
    branchTargets.forEach(target => {
      console.log(`   ${target.name}: ₹${(target.targetValue / 100000).toFixed(1)}L`);
    });

    // Clear existing inventory data from products
    console.log('\n🗑️  Clearing existing inventory...');
    await Product.updateMany({}, { $set: { stockByBranch: [] } });
    console.log('✅ Cleared existing inventory data');

    // Distribute inventory across branches
    console.log('\n🔄 Distributing inventory across branches...\n');

    const branchStats = [];

    for (const targetConfig of branchTargets) {
      const { branch, targetValue, name, isMain } = targetConfig;

      console.log(`📍 Processing ${name}...`);

      let totalValue = 0;
      let productsStocked = 0;
      let totalQuantity = 0;
      const usedLocations = new Set();

      // Calculate per-product target value
      const productsToStock = isMain ? products.length : Math.floor(products.length * (Math.random() * 0.2 + 0.6));
      const perProductTarget = targetValue / productsToStock;

      // Shuffle products for variety in smaller branches
      const productsList = isMain ? [...products] :
        [...products].sort(() => Math.random() - 0.5).slice(0, productsToStock);

      for (const product of productsList) {
        const quantity = calculateQuantityForProduct(product, perProductTarget, isMain);

        if (quantity === 0) continue;

        const reorderLevel = calculateReorderLevel(quantity);
        const maxStockLevel = calculateMaxStockLevel(quantity);

        // Get unique storage location
        let location;
        do {
          location = getRandomElement(storageLocations);
        } while (usedLocations.has(location) && usedLocations.size < storageLocations.length);
        usedLocations.add(location);

        // Add stock data to product
        const stockData = {
          branch: branch._id,
          quantity,
          reorderLevel,
          maxStockLevel,
          reservedQuantity: 0,
          lastRestocked: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000), // Last 30 days
          location
        };

        // Update product
        await Product.findByIdAndUpdate(
          product._id,
          { $push: { stockByBranch: stockData } }
        );

        const itemValue = quantity * product.pricing.costPrice;
        totalValue += itemValue;
        totalQuantity += quantity;
        productsStocked++;
      }

      branchStats.push({
        name,
        productsStocked,
        totalQuantity,
        totalValue,
        targetValue,
        achievement: (totalValue / targetValue * 100).toFixed(1)
      });

      console.log(`   ✅ ${name}:`);
      console.log(`      Products: ${productsStocked}/${products.length}`);
      console.log(`      Total Units: ${totalQuantity.toLocaleString('en-IN')}`);
      console.log(`      Inventory Value: ₹${Math.round(totalValue).toLocaleString('en-IN')}`);
      console.log(`      Target: ₹${targetValue.toLocaleString('en-IN')}`);
      console.log(`      Achievement: ${branchStats[branchStats.length - 1].achievement}%\n`);
    }

    // Overall statistics
    console.log('\n📈 Overall Inventory Statistics:');

    const totalValue = branchStats.reduce((sum, stat) => sum + stat.totalValue, 0);
    const totalQuantity = branchStats.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    const totalTarget = branchTargets.reduce((sum, target) => sum + target.targetValue, 0);

    console.log(`   📦 Total Products in Catalog: ${products.length}`);
    console.log(`   📊 Total Units Stocked: ${totalQuantity.toLocaleString('en-IN')}`);
    console.log(`   💰 Total Inventory Value: ₹${Math.round(totalValue).toLocaleString('en-IN')}`);
    console.log(`   🎯 Target Inventory Value: ₹${totalTarget.toLocaleString('en-IN')}`);
    console.log(`   ✅ Overall Achievement: ${(totalValue / totalTarget * 100).toFixed(1)}%`);

    console.log('\n   🏢 By Branch:');
    branchStats.forEach(stat => {
      const percentage = (stat.totalValue / totalValue * 100).toFixed(1);
      console.log(`      ${stat.name}:`);
      console.log(`         Products: ${stat.productsStocked} (${(stat.productsStocked/products.length*100).toFixed(0)}%)`);
      console.log(`         Value: ₹${Math.round(stat.totalValue).toLocaleString('en-IN')} (${percentage}%)`);
      console.log(`         Units: ${stat.totalQuantity.toLocaleString('en-IN')}`);
      console.log(`         Avg Units/Product: ${Math.round(stat.totalQuantity / stat.productsStocked)}`);
    });

    // Verify data integrity
    console.log('\n🔍 Verifying data integrity...');
    const verifyProducts = await Product.find({ 'stockByBranch.0': { $exists: true } });
    console.log(`   ✅ Products with inventory: ${verifyProducts.length}/${products.length}`);

    // Check products with low stock (simple count)
    let lowStockCount = 0;
    for (const product of verifyProducts) {
      if (product.stockByBranch && product.stockByBranch.length > 0) {
        const hasLowStock = product.stockByBranch.some(stock => stock.quantity <= stock.reorderLevel);
        if (hasLowStock) lowStockCount++;
      }
    }
    console.log(`   ⚠️  Products below reorder level: ${lowStockCount}`);

    console.log('\n✅ Inventory distribution completed successfully!');

  } catch (error) {
    console.error('\n❌ Error seeding inventory:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedInventory()
    .then(() => {
      console.log('✨ Seed process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Seed process failed:', error);
      process.exit(1);
    });
}

module.exports = seedInventory;
