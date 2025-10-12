const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function updateSalesDates() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;
    const salesCollection = db.collection('sales');

    // Get all sales
    const allSales = await salesCollection.find({}).sort({ createdAt: 1 }).toArray();
    console.log(`\n📊 Total sales found: ${allSales.length}`);

    if (allSales.length === 0) {
      console.log('❌ No sales found.');
      return;
    }

    // Calculate date shift
    const newestSale = allSales[allSales.length - 1];
    const today = new Date();
    // Set to end of today, but use floor instead of ceil to ensure we don't go to tomorrow
    today.setHours(23, 59, 59, 999);
    const daysToShift = Math.floor((today - newestSale.createdAt) / (1000 * 60 * 60 * 24));

    console.log(`\n🔄 Shifting all sales by ${daysToShift} days forward...`);
    console.log(`   Oldest: ${allSales[0].createdAt.toLocaleDateString()}`);
    console.log(`   Newest: ${newestSale.createdAt.toLocaleDateString()} → ${today.toLocaleDateString()}\n`);

    // Update in batches using raw MongoDB
    const batchSize = 100;
    let updated = 0;

    for (let i = 0; i < allSales.length; i += batchSize) {
      const batch = allSales.slice(i, i + batchSize);
      
      const bulkOps = batch.map(sale => {
        const newDate = new Date(sale.createdAt);
        newDate.setDate(newDate.getDate() + daysToShift);
        
        return {
          updateOne: {
            filter: { _id: sale._id },
            update: {
              $set: {
                createdAt: newDate,
                updatedAt: newDate
              }
            }
          }
        };
      });

      const result = await salesCollection.bulkWrite(bulkOps);
      updated += result.modifiedCount;
      
      if (i % 500 === 0) {
        console.log(`   Progress: ${updated}/${allSales.length}...`);
      }
    }

    console.log(`\n✅ Updated ${updated} sales!`);

    // Verify
    const verification = await salesCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('\n📅 Verification - Last 5 sales:');
    verification.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.createdAt.toLocaleDateString()} ${s.createdAt.toLocaleTimeString()}`);
    });

    // Check counts
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const count24h = await salesCollection.countDocuments({ createdAt: { $gte: last24h } });
    const count7d = await salesCollection.countDocuments({ createdAt: { $gte: last7d } });
    const count30d = await salesCollection.countDocuments({ createdAt: { $gte: last30d } });

    console.log('\n📈 Sales Distribution:');
    console.log(`   Last 24 hours: ${count24h} sales`);
    console.log(`   Last 7 days: ${count7d} sales`);
    console.log(`   Last 30 days: ${count30d} sales`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateSalesDates();
