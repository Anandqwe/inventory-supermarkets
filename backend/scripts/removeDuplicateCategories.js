const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function removeDuplicateCategories() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    // Find all categories
    const categories = await Category.find({}).sort({ createdAt: 1 });

    console.log('\n📋 Total Categories:', categories.length);

    // Group by name
    const categoryMap = {};
    categories.forEach(cat => {
      if (!categoryMap[cat.name]) {
        categoryMap[cat.name] = [];
      }
      categoryMap[cat.name].push(cat);
    });

    // Find duplicates
    const duplicates = Object.entries(categoryMap).filter(([name, cats]) => cats.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} duplicate category names\n`);

    let totalRemoved = 0;

    // Process each duplicate
    for (const [name, cats] of duplicates) {
      console.log(`📦 Processing "${name}" (${cats.length} duplicates)...`);

      // Keep the first one (oldest), remove others
      const [keepCategory, ...removeCats] = cats;
      console.log(`   ✅ Keeping: ${keepCategory._id} (created: ${keepCategory.createdAt})`);

      // For each duplicate to remove
      for (const removeCat of removeCats) {
        console.log(`   🗑️  Removing: ${removeCat._id} (created: ${removeCat.createdAt})`);

        // Update all products using this duplicate category to use the kept one
        const updateResult = await Product.updateMany(
          { category: removeCat._id },
          { $set: { category: keepCategory._id } }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(`      📝 Updated ${updateResult.modifiedCount} products`);
        }

        // Delete the duplicate category
        await Category.deleteOne({ _id: removeCat._id });
        totalRemoved++;
      }
    }

    console.log(`\n✅ Removed ${totalRemoved} duplicate categories`);

    // Also handle "Frozen" vs "Frozen Foods" - they should be merged
    const frozenCategory = await Category.findOne({ name: 'Frozen' });
    const frozenFoodsCategory = await Category.findOne({ name: 'Frozen Foods' });

    if (frozenCategory && frozenFoodsCategory) {
      console.log('\n🔄 Merging "Frozen" and "Frozen Foods"...');

      // Update products using "Frozen" to use "Frozen Foods" (more descriptive name)
      const mergeResult = await Product.updateMany(
        { category: frozenCategory._id },
        { $set: { category: frozenFoodsCategory._id } }
      );

      if (mergeResult.modifiedCount > 0) {
        console.log(`   📝 Updated ${mergeResult.modifiedCount} products`);
      }

      // Delete "Frozen" category
      await Category.deleteOne({ _id: frozenCategory._id });
      console.log('   ✅ Merged "Frozen" into "Frozen Foods"');
    }

    // Verify final state
    console.log('\n🔍 Verification:');
    const finalCategories = await Category.find({}).sort({ name: 1 });
    console.log(`   📊 Total unique categories: ${finalCategories.length}`);

    const finalNames = {};
    finalCategories.forEach(cat => {
      if (finalNames[cat.name]) {
        finalNames[cat.name]++;
      } else {
        finalNames[cat.name] = 1;
      }
    });

    const stillDuplicated = Object.entries(finalNames).filter(([, count]) => count > 1);
    if (stillDuplicated.length > 0) {
      console.log('   ⚠️  Still has duplicates:', stillDuplicated);
    } else {
      console.log('   ✅ No duplicates remaining');
    }

    console.log('\n📋 Final Category List:');
    finalCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

removeDuplicateCategories();
