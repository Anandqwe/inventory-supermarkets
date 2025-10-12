const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Branch = require('../src/models/Branch');
const Customer = require('../src/models/Customer');
const Sale = require('../src/models/Sale');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const Unit = require('../src/models/Unit');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate sale number (SAL + date + sequence)
function generateSaleNumber(date, sequence) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `SAL${dateStr}${String(sequence).padStart(4, '0')}`;
}

// Generate invoice number (INV + date + sequence)
function generateInvoiceNumber(date, sequence) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV${dateStr}${String(sequence).padStart(4, '0')}`;
}

// Payment method distribution (Cash 15%, Card 45%, UPI 35%, Net Banking 5%)
function getPaymentMethod() {
  const rand = Math.random();
  if (rand < 0.15) return 'cash';
  if (rand < 0.60) return 'card';
  if (rand < 0.95) return 'upi';
  return 'netbanking';
}

// Generate payment reference
function generatePaymentReference(method) {
  switch (method) {
    case 'card':
      return `CARD${Date.now()}${getRandomInt(1000, 9999)}`;
    case 'upi':
      return `UPI${Date.now()}${getRandomInt(100000, 999999)}`;
    case 'mobile':
      return `WALLET${Date.now()}${getRandomInt(10000, 99999)}`;
    case 'netbanking':
      return `NB${Date.now()}${getRandomInt(100000, 999999)}`;
    default:
      return null;
  }
}

// Customer purchase pattern based on tier
function getItemCount(customerTier) {
  switch (customerTier) {
    case 'vip':
      return getRandomInt(8, 20); // VIP buy more items
    case 'regular':
      return getRandomInt(5, 12); // Loyal/Regular moderate
    case 'retail':
      return getRandomInt(2, 8);  // Occasional fewer items
    default:
      return getRandomInt(3, 10);
  }
}

// Calculate average transaction value based on tier
function getTargetTransactionValue(customerTier) {
  switch (customerTier) {
    case 'vip':
      return getRandomFloat(2000, 5000);
    case 'regular':
      return getRandomFloat(800, 2000);
    case 'retail':
      return getRandomFloat(200, 800);
    default:
      return getRandomFloat(500, 1500);
  }
}

// Generate sale data
async function generateSale(
  branch,
  branchProducts,
  branchCustomers,
  cashiers,
  date,
  sequence
) {
  const customer = getRandomElement(branchCustomers);
  const cashier = getRandomElement(cashiers);
  
  const customerTier = customer.customerGroup || 'retail';
  const itemCount = getItemCount(customerTier);
  const targetValue = getTargetTransactionValue(customerTier);
  
  // Select random products available at this branch
  const selectedProducts = [];
  const shuffledProducts = [...branchProducts].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(itemCount, shuffledProducts.length); i++) {
    selectedProducts.push(shuffledProducts[i]);
  }
  
  // Build sale items
  const items = [];
  let subtotal = 0;
  
  for (const product of selectedProducts) {
    const branchStock = product.stockByBranch.find(
      s => s.branch.toString() === branch._id.toString()
    );
    
    if (!branchStock || branchStock.quantity <= 0) continue;
    
    // Quantity based on product type and customer tier
    let maxQty = Math.min(branchStock.quantity, 10);
    if (customerTier === 'vip') maxQty = Math.min(branchStock.quantity, 15);
    if (customerTier === 'retail') maxQty = Math.min(branchStock.quantity, 5);
    
    const quantity = getRandomInt(1, Math.max(1, maxQty));
    const sellingPrice = product.pricing.sellingPrice;
    const costPrice = product.pricing.costPrice;
    const unitPrice = sellingPrice;
    const total = sellingPrice * quantity;
    
    items.push({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      quantity,
      costPrice,
      sellingPrice,
      unitPrice,
      total,
      discount: 0,
      tax: 0
    });
    
    subtotal += total;
  }
  
  if (items.length === 0) return null; // No items available
  
  // Apply discount for VIP customers (5-15% chance)
  let discountPercentage = 0;
  let discountAmount = 0;
  
  if (customerTier === 'vip' && Math.random() < 0.15) {
    discountPercentage = getRandomFloat(5, 10);
    discountAmount = subtotal * (discountPercentage / 100);
  }
  
  const total = subtotal - discountAmount;
  
  // Payment method
  const paymentMethod = getPaymentMethod();
  const paymentReference = generatePaymentReference(paymentMethod);
  
  const payments = [{
    method: paymentMethod,
    amount: total,
    reference: paymentReference,
    receivedAt: date
  }];
  
  // Calculate change for cash payments
  let changeAmount = 0;
  if (paymentMethod === 'cash') {
    const denominations = [100, 200, 500, 2000];
    let cashGiven = total;
    
    // Round up to nearest denomination
    for (const denom of denominations.reverse()) {
      if (total <= denom) {
        cashGiven = denom;
        break;
      }
      if (total > denom && total < denom * 1.5) {
        cashGiven = Math.ceil(total / denom) * denom;
        break;
      }
    }
    
    changeAmount = cashGiven - total;
  }
  
  // Sale data
  const saleData = {
    saleNumber: generateSaleNumber(date, sequence),
    invoiceNumber: generateInvoiceNumber(date, sequence),
    branch: branch._id,
    items,
    customer: customer._id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    subtotal,
    discountPercentage,
    discountAmount,
    taxPercentage: 0,
    taxAmount: 0,
    shippingAmount: 0,
    total,
    paymentMethod,
    payments,
    amountPaid: total,
    amountDue: 0,
    changeAmount,
    status: 'completed',
    saleType: 'retail',
    createdBy: cashier._id,
    createdAt: date,
    updatedAt: date
  };
  
  return saleData;
}

// Main seed function
async function seedSales() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);
    
    // Get branches
    console.log('\n🏢 Loading branches...');
    const branches = await Branch.find({}).sort({ code: 1 });
    
    if (branches.length === 0) {
      console.log('⚠️  No branches found. Please run seed:branches first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${branches.length} branches`);
    
    // Get products with inventory
    console.log('\n📦 Loading products with inventory...');
    const products = await Product.find({ 'stockByBranch.0': { $exists: true } });
    
    if (products.length === 0) {
      console.log('⚠️  No products with inventory found. Please run seed:inventory first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${products.length} products with inventory`);
    
    // Get customers by branch
    console.log('\n👥 Loading customers...');
    const customers = await Customer.find({ isActive: true });
    
    if (customers.length === 0) {
      console.log('⚠️  No customers found. Please run seed:customers first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${customers.length} active customers`);
    
    // Get cashiers
    console.log('\n👨‍💼 Loading cashiers...');
    const cashiers = await User.find({ 
      role: { $in: ['Admin', 'Regional Manager', 'Store Manager', 'Inventory Manager', 'Cashier'] },
      isActive: true 
    });
    
    if (cashiers.length === 0) {
      console.log('⚠️  No cashiers found. Please run seed:users first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${cashiers.length} staff members who can make sales`);
    
    // Clear existing sales
    console.log('\n🗑️  Clearing existing sales...');
    const deleteResult = await Sale.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing sales`);
    
    // Sales distribution by branch (Andheri 50%, Bandra 30%, Vile Parle 20%)
    const salesTarget = 1750;
    const revenueTarget = 5000000; // ₹50L
    
    const branchConfigs = [
      { 
        branch: branches[0], 
        name: 'Andheri West',
        salesCount: Math.round(salesTarget * 0.50), // 875 sales
        revenueTarget: revenueTarget * 0.50,         // ₹25L
        products: products.filter(p => p.stockByBranch.some(s => s.branch.toString() === branches[0]._id.toString())),
        customers: customers.filter(c => c.registeredBranch.toString() === branches[0]._id.toString())
      },
      { 
        branch: branches[1], 
        name: 'Bandra West',
        salesCount: Math.round(salesTarget * 0.30), // 525 sales
        revenueTarget: revenueTarget * 0.30,         // ₹15L
        products: products.filter(p => p.stockByBranch.some(s => s.branch.toString() === branches[1]._id.toString())),
        customers: customers.filter(c => c.registeredBranch.toString() === branches[1]._id.toString())
      },
      { 
        branch: branches[2], 
        name: 'Vile Parle East',
        salesCount: Math.round(salesTarget * 0.20), // 350 sales
        revenueTarget: revenueTarget * 0.20,         // ₹10L
        products: products.filter(p => p.stockByBranch.some(s => s.branch.toString() === branches[2]._id.toString())),
        customers: customers.filter(c => c.registeredBranch.toString() === branches[2]._id.toString())
      }
    ];
    
    console.log('\n📊 Sales Target:');
    console.log(`   Total Transactions: ${salesTarget}`);
    console.log(`   Total Revenue Target: ₹${(revenueTarget / 100000).toFixed(1)}L`);
    branchConfigs.forEach(config => {
      console.log(`   ${config.name}: ${config.salesCount} sales, ₹${(config.revenueTarget / 100000).toFixed(1)}L target`);
      console.log(`      Products: ${config.products.length}, Customers: ${config.customers.length}`);
    });
    
    // Generate sales data over last 90 days (ending TODAY)
    console.log('\n🔄 Generating sales transactions...\n');
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 90); // Last 90 days
    
    console.log(`📅 Sales date range: ${startDate.toLocaleDateString()} to ${today.toLocaleDateString()}`);
    
    const branchStats = [];
    let globalSequence = 1;
    
    for (const config of branchConfigs) {
      console.log(`📍 Generating sales for ${config.name}...`);
      
      const sales = [];
      let totalRevenue = 0;
      let totalProfit = 0;
      const paymentMethodCounts = { cash: 0, card: 0, upi: 0, netbanking: 0 };
      
      // Distribute sales across 90 days with realistic patterns
      const salesPerDay = config.salesCount / 90;
      let generatedSales = 0;
      
      for (let day = 0; day < 90; day++) {
        const saleDate = new Date(startDate);
        saleDate.setDate(startDate.getDate() + day);
        
        // Weekend boost (Saturday/Sunday have 30% more sales)
        const dayOfWeek = saleDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dailyTarget = Math.round(salesPerDay * (isWeekend ? 1.3 : 1.0));
        
        let dailySequence = 1;
        
        for (let i = 0; i < dailyTarget && generatedSales < config.salesCount; i++) {
          // Random time during business hours (9 AM to 9 PM)
          const hour = getRandomInt(9, 21);
          const minute = getRandomInt(0, 59);
          const second = getRandomInt(0, 59);
          
          const saleDateTime = new Date(saleDate);
          saleDateTime.setHours(hour, minute, second);
          
          const saleData = await generateSale(
            config.branch,
            config.products,
            config.customers,
            cashiers,
            saleDateTime,
            globalSequence++
          );
          
          if (saleData) {
            sales.push(saleData);
            totalRevenue += saleData.total;
            
            // Calculate profit
            const costTotal = saleData.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
            totalProfit += (saleData.total - costTotal);
            
            // Track payment methods
            paymentMethodCounts[saleData.paymentMethod]++;
            
            generatedSales++;
            dailySequence++;
          }
        }
      }
      
      // Batch insert sales
      if (sales.length > 0) {
        console.log(`   💾 Inserting ${sales.length} sales...`);
        await Sale.insertMany(sales);
      }
      
      const avgTransaction = sales.length > 0 ? totalRevenue / sales.length : 0;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
      
      branchStats.push({
        name: config.name,
        salesCount: sales.length,
        revenue: totalRevenue,
        profit: totalProfit,
        avgTransaction,
        profitMargin,
        paymentMethods: paymentMethodCounts
      });
      
      console.log(`   ✅ ${config.name}:`);
      console.log(`      Sales: ${sales.length}`);
      console.log(`      Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
      console.log(`      Profit: ₹${Math.round(totalProfit).toLocaleString('en-IN')} (${profitMargin.toFixed(1)}%)`);
      console.log(`      Avg Transaction: ₹${Math.round(avgTransaction).toLocaleString('en-IN')}`);
      console.log(`      Payment Mix: Cash ${paymentMethodCounts.cash}, Card ${paymentMethodCounts.card}, UPI ${paymentMethodCounts.upi}, NetBanking ${paymentMethodCounts.netbanking}\n`);
    }
    
    // Overall statistics
    console.log('\n📈 Overall Sales Statistics:');
    
    const totalSales = branchStats.reduce((sum, stat) => sum + stat.salesCount, 0);
    const totalRevenue = branchStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const totalProfit = branchStats.reduce((sum, stat) => sum + stat.profit, 0);
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
    const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    console.log(`   📊 Total Transactions: ${totalSales}`);
    console.log(`   💰 Total Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
    console.log(`   💵 Total Profit: ₹${Math.round(totalProfit).toLocaleString('en-IN')} (${overallMargin.toFixed(1)}%)`);
    console.log(`   📈 Avg Transaction: ₹${Math.round(avgTransaction).toLocaleString('en-IN')}`);
    console.log(`   🎯 Revenue Achievement: ${(totalRevenue / revenueTarget * 100).toFixed(1)}%`);
    
    console.log('\n   🏢 By Branch:');
    branchStats.forEach(stat => {
      const revenuePercentage = (stat.revenue / totalRevenue * 100).toFixed(1);
      console.log(`      ${stat.name}:`);
      console.log(`         Sales: ${stat.salesCount} (${(stat.salesCount/totalSales*100).toFixed(1)}%)`);
      console.log(`         Revenue: ₹${Math.round(stat.revenue).toLocaleString('en-IN')} (${revenuePercentage}%)`);
      console.log(`         Profit: ₹${Math.round(stat.profit).toLocaleString('en-IN')} (${stat.profitMargin.toFixed(1)}%)`);
      console.log(`         Avg: ₹${Math.round(stat.avgTransaction).toLocaleString('en-IN')}`);
    });
    
    // Payment method distribution
    const totalPayments = branchStats.reduce((acc, stat) => {
      acc.cash += stat.paymentMethods.cash;
      acc.card += stat.paymentMethods.card;
      acc.upi += stat.paymentMethods.upi;
      acc.netbanking += stat.paymentMethods.netbanking;
      return acc;
    }, { cash: 0, card: 0, upi: 0, netbanking: 0 });
    
    console.log('\n   💳 Payment Methods:');
    console.log(`      Cash: ${totalPayments.cash} (${(totalPayments.cash/totalSales*100).toFixed(1)}%)`);
    console.log(`      Card: ${totalPayments.card} (${(totalPayments.card/totalSales*100).toFixed(1)}%)`);
    console.log(`      UPI: ${totalPayments.upi} (${(totalPayments.upi/totalSales*100).toFixed(1)}%)`);
    console.log(`      NetBanking: ${totalPayments.netbanking} (${(totalPayments.netbanking/totalSales*100).toFixed(1)}%)`);
    
    console.log('\n✅ Sales seeding completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error seeding sales:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
if (require.main === module) {
  seedSales()
    .then(() => {
      console.log('✨ Seed process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Seed process failed:', error);
      process.exit(1);
    });
}

module.exports = seedSales;
