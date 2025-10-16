const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Adjustment = require('../src/models/Adjustment');
const Transfer = require('../src/models/Transfer');

const cleanupData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count existing records
    const adjustmentCount = await Adjustment.countDocuments();
    const transferCount = await Transfer.countDocuments();

    console.log('📊 Current Data:');
    console.log(`   - Stock Adjustments: ${adjustmentCount}`);
    console.log(`   - Stock Transfers: ${transferCount}\n`);

    if (adjustmentCount === 0 && transferCount === 0) {
      console.log('✨ No data to clean up. Database is already clean!');
      process.exit(0);
    }

    // Ask for confirmation
    console.log('⚠️  WARNING: This will DELETE ALL stock adjustments and transfers!');
    console.log('   This action cannot be undone.\n');

    // Delete all adjustments
    if (adjustmentCount > 0) {
      console.log('🗑️  Deleting stock adjustments...');
      const adjustmentResult = await Adjustment.deleteMany({});
      console.log(`   ✅ Deleted ${adjustmentResult.deletedCount} adjustments`);
    }

    // Delete all transfers
    if (transferCount > 0) {
      console.log('🗑️  Deleting stock transfers...');
      const transferResult = await Transfer.deleteMany({});
      console.log(`   ✅ Deleted ${transferResult.deletedCount} transfers`);
    }

    console.log('\n✨ Cleanup completed successfully!');
    console.log('   All stock adjustments and transfers have been removed.');

    // Verify cleanup
    const remainingAdjustments = await Adjustment.countDocuments();
    const remainingTransfers = await Transfer.countDocuments();

    console.log('\n📊 Final Count:');
    console.log(`   - Stock Adjustments: ${remainingAdjustments}`);
    console.log(`   - Stock Transfers: ${remainingTransfers}`);

    if (remainingAdjustments === 0 && remainingTransfers === 0) {
      console.log('\n✅ Database is now clean!');
    } else {
      console.log('\n⚠️  Warning: Some records may still exist');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
console.log('🧹 Stock Adjustments & Transfers Cleanup Script');
console.log('================================================\n');

cleanupData();
