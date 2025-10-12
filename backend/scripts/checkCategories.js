const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../src/models/Category');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkCategories() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    const categories = await Category.find({})
      .select('name parentCategory isActive')
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    console.log('\n📋 Total Categories:', categories.length);
    console.log('\n📊 Category List:');

    const categoryNames = {};
    categories.forEach((cat, index) => {
      const parent = cat.parentCategory ? ` (parent: ${cat.parentCategory.name})` : ' (top-level)';
      const active = cat.isActive ? '✅' : '❌';
      console.log(`${index + 1}. ${active} ${cat.name}${parent}`);

      // Track duplicates
      if (categoryNames[cat.name]) {
        categoryNames[cat.name].push(cat._id);
      } else {
        categoryNames[cat.name] = [cat._id];
      }
    });

    // Check for duplicates
    console.log('\n🔍 Checking for duplicates...');
    const duplicates = Object.entries(categoryNames).filter(([name, ids]) => ids.length > 1);

    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicate categories:');
      duplicates.forEach(([name, ids]) => {
        console.log(`   - "${name}" appears ${ids.length} times`);
        console.log(`     IDs: ${ids.join(', ')}`);
      });
    } else {
      console.log('✅ No duplicates found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkCategories();
