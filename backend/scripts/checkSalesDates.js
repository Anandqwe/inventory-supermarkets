const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Sale = require('../src/models/Sale');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkSalesDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const sales = await Sale.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log('📅 Last 10 sales (most recent first):');
    sales.forEach((sale, i) => {
      console.log(`${i + 1}. ${sale.saleNumber} - ${sale.createdAt.toLocaleString()} (₹${Math.round(sale.total)})`);
    });

    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    console.log(`\n🕐 Current time: ${now.toLocaleString()}`);
    console.log(`📊 Last 24h start: ${last24h.toLocaleString()}`);
    console.log(`📊 Last 7d start: ${last7d.toLocaleString()}`);
    
    const count24h = await Sale.countDocuments({ createdAt: { $gte: last24h } });
    const count7d = await Sale.countDocuments({ createdAt: { $gte: last7d } });
    
    console.log(`\n✅ Sales in last 24h: ${count24h}`);
    console.log(`✅ Sales in last 7d: ${count7d}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSalesDates();
