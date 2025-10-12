const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Categories used in current Mumbai seed data
const ACTIVE_CATEGORIES = [
  'Beverages',
  'Staples & Grains',
  'Personal Care',
  'Baby Care',
  'Snacks',
  'Dairy',
  'Frozen Foods',
  'Cleaning & Household',
  'Pantry & Cooking'
];

async function removeOldCategories() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    // Find all categories
    const allCategories = await Category.find({}).sort({ name: 1 });

    console.log('\n📋 Total Categories in Database:', allCategories.length);
    console.log('\n📊 Current Categories:');
    allCategories.forEach((cat, index) => {
      const isActive = ACTIVE_CATEGORIES.includes(cat.name);
      const status = isActive ? '✅ KEEP' : '❌ REMOVE';
      console.log(`   ${index + 1}. ${status} - ${cat.name}`);
    });

    // Find old categories to remove
    const oldCategories = allCategories.filter(cat => !ACTIVE_CATEGORIES.includes(cat.name));

    if (oldCategories.length === 0) {
      console.log('\n✅ No old categories to remove. Database is clean!');
      return;
    }

    console.log(`\n🗑️  Found ${oldCategories.length} old categories to remove:\n`);

    let totalRemoved = 0;
    let totalProductsUpdated = 0;

    // Process each old category
    for (const oldCat of oldCategories) {
      console.log(`📦 Processing "${oldCat.name}"...`);

      // Check if any products use this category
      const productsCount = await Product.countDocuments({ category: oldCat._id });

      if (productsCount > 0) {
        console.log(`   ⚠️  Warning: ${productsCount} products are using this category`);
        console.log('   🗑️  Deleting these products as they\'re from old seed data...');

        // Delete products using this old category
        const deleteResult = await Product.deleteMany({ category: oldCat._id });
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} products`);
        totalProductsUpdated += deleteResult.deletedCount;
      } else {
        console.log('   ℹ️  No products using this category');
      }

      // Delete the category
      await Category.deleteOne({ _id: oldCat._id });
      console.log(`   ✅ Removed category: ${oldCat.name}`);
      totalRemoved++;
    }

    console.log('\n✅ Cleanup Complete!');
    console.log(`   📊 Categories removed: ${totalRemoved}`);
    console.log(`   📦 Products removed: ${totalProductsUpdated}`);

    // Verify final state
    console.log('\n🔍 Verification:');
    const finalCategories = await Category.find({}).sort({ name: 1 });
    console.log(`   📊 Total categories remaining: ${finalCategories.length}`);

    console.log('\n📋 Final Category List:');
    finalCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });

    // Check product counts
    const totalProducts = await Product.countDocuments({});
    console.log(`\n📦 Total products in database: ${totalProducts}`);

    if (totalProducts === 0) {
      console.log('\n⚠️  WARNING: All products have been removed!');
      console.log('💡 You need to run: npm run seed:master');
      console.log('   This will recreate all data with the current Mumbai seed data.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

removeOldCategories();
