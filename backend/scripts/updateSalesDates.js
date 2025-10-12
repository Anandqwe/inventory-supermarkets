const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Sale = require('../src/models/Sale');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function updateSalesDates() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    // Get all sales
    const allSales = await Sale.find({}).sort({ createdAt: 1 });
    console.log(`\n📊 Total sales found: ${allSales.length}`);
    
    if (allSales.length === 0) {
      console.log('❌ No sales found. Please run seed:sales first.');
      return;
    }

    // Calculate date range
    const oldestSale = allSales[0];
    const newestSale = allSales[allSales.length - 1];
    console.log(`📅 Current date range: ${oldestSale.createdAt.toLocaleDateString()} to ${newestSale.createdAt.toLocaleDateString()}`);

    // Calculate how many days to shift to make the newest sale today
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const daysToShift = Math.floor((today - newestSale.createdAt) / (1000 * 60 * 60 * 24));
    
    console.log(`\n🔄 Shifting all sales by ${daysToShift} days forward...`);
    console.log(`   Current newest sale: ${newestSale.createdAt.toLocaleDateString()}`);
    console.log(`   Target: ${today.toLocaleDateString()} (today)`);
    console.log(`   This will spread sales across the last ~${Math.floor((newestSale.createdAt - oldestSale.createdAt) / (1000 * 60 * 60 * 24))} days\n`);

    let updated = 0;
    const batchSize = 100;
    
    for (let i = 0; i < allSales.length; i += batchSize) {
      const batch = allSales.slice(i, i + batchSize);
      
      for (const sale of batch) {
        const newDate = new Date(sale.createdAt);
        newDate.setDate(newDate.getDate() + daysToShift);
        
        // Disable timestamps and update directly
        await Sale.findByIdAndUpdate(
          sale._id,
          { 
            createdAt: newDate,
            updatedAt: newDate
          },
          { timestamps: false } // Disable automatic timestamp updates
        );
        
        updated++;
      }
      
      if ((i / batchSize) % 5 === 0) {
        console.log(`   Progress: ${updated}/${allSales.length} sales updated...`);
      }
    }

    console.log(`\n✅ Updated all ${updated} sales!`);

    // Verify new date range
    const updatedSales = await Sale.find({}).sort({ createdAt: 1 });
    const newOldest = updatedSales[0];
    const newNewest = updatedSales[updatedSales.length - 1];
    console.log(`\n📅 New date range: ${newOldest.createdAt.toLocaleDateString()} to ${newNewest.createdAt.toLocaleDateString()}`);

    // Show sales counts for recent periods
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const sales24h = await Sale.countDocuments({ createdAt: { $gte: last24Hours } });
    const sales7d = await Sale.countDocuments({ createdAt: { $gte: last7Days } });
    const sales30d = await Sale.countDocuments({ createdAt: { $gte: last30Days } });

    console.log('\n📈 Sales Distribution:');
    console.log(`   Last 24 hours: ${sales24h} sales`);
    console.log(`   Last 7 days: ${sales7d} sales`);
    console.log(`   Last 30 days: ${sales30d} sales`);
    console.log(`   Total: ${updatedSales.length} sales`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateSalesDates();
