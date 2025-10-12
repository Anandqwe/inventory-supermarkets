const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Sale = require('../src/models/Sale');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const User = require('../src/models/User');
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

function generateSaleNumber(date, sequence) {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `SALE-${dateStr}-${String(sequence).padStart(6, '0')}`;
}

function generatePaymentReference(method) {
  switch (method) {
  case 'card':
    return `CARD${Date.now()}${getRandomInt(1000, 9999)}`;
  case 'upi':
    return `UPI${Date.now()}${getRandomInt(100000, 999999)}`;
  case 'netbanking':
    return `NB${Date.now()}${getRandomInt(100000, 999999)}`;
  default:
    return null;
  }
}

async function addRecentSales() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database:', mongoose.connection.db.databaseName);

    // Load branches
    console.log('\n🏢 Loading branches...');
    const branches = await Branch.find({}).sort({ name: 1 });
    if (branches.length === 0) {
      console.log('❌ No branches found. Please run seed:branches first.');
      process.exit(1);
    }
    console.log(`✅ Found ${branches.length} branches`);

    // Load products with inventory
    console.log('\n📦 Loading products with inventory...');
    const products = await Product.find({
      isActive: true,
      'stockByBranch.0': { $exists: true }
    });
    if (products.length === 0) {
      console.log('❌ No products with inventory found.');
      process.exit(1);
    }
    console.log(`✅ Found ${products.length} products with inventory`);

    // Load customers
    console.log('\n👥 Loading customers...');
    const customers = await Customer.find({ isActive: true });
    console.log(`✅ Found ${customers.length} active customers`);

    // Load cashiers
    console.log('\n👨‍💼 Loading staff who can make sales...');
    const cashiers = await User.find({
      isActive: true,
      $or: [
        { role: 'Admin' },
        { role: 'Regional Manager' },
        { role: 'Store Manager' },
        { role: 'Cashier' }
      ]
    });

    if (cashiers.length === 0) {
      console.log('❌ No staff members found. Please run seed:users first.');
      process.exit(1);
    }
    console.log(`✅ Found ${cashiers.length} staff members`);

    // Find highest existing sale sequence
    const lastSale = await Sale.findOne({}).sort({ saleNumber: -1 }).limit(1);
    let globalSequence = 1;
    if (lastSale && lastSale.saleNumber) {
      const match = lastSale.saleNumber.match(/(\d{6})$/);
      if (match) {
        globalSequence = parseInt(match[1]) + 1;
      }
    }
    console.log(`\n📊 Starting sale sequence from: ${globalSequence}`);

    // Generate sales for last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    console.log('\n🔄 Generating recent sales (last 7 days)...');
    console.log(`   Date range: ${sevenDaysAgo.toLocaleDateString()} to ${today.toLocaleDateString()}\n`);

    // Sales distribution: More recent days have more sales
    const salesPerBranch = {
      [branches[0]._id.toString()]: 70,  // Andheri (largest)
      [branches[1]._id.toString()]: 50,  // Bandra
      [branches[2]._id.toString()]: 30   // Vile Parle
    };

    let totalSalesAdded = 0;
    let totalRevenue = 0;

    for (const branch of branches) {
      const branchSalesTarget = salesPerBranch[branch._id.toString()] || 30;
      console.log(`📍 Generating ${branchSalesTarget} sales for ${branch.name}...`);

      // Get products available in this branch
      const branchProducts = products.filter(p =>
        p.stockByBranch.some(s => s.branch.toString() === branch._id.toString() && s.quantity > 0)
      );

      // Get cashiers for this branch
      const branchCashiers = cashiers.filter(c =>
        c.role === 'Admin' || c.role === 'Regional Manager' || c.branch?.toString() === branch._id.toString()
      );

      // Get customers registered at this branch
      const branchCustomers = customers.filter(c =>
        c.registeredBranch?.toString() === branch._id.toString()
      );

      const sales = [];
      let branchRevenue = 0;

      // Distribute sales across 7 days
      for (let day = 0; day < 7; day++) {
        const saleDate = new Date(sevenDaysAgo);
        saleDate.setDate(sevenDaysAgo.getDate() + day);

        // More sales on recent days and weekends
        const daysFromToday = 7 - day;
        const recencyMultiplier = 0.7 + (daysFromToday / 7) * 0.6; // 0.7 to 1.3
        const dayOfWeek = saleDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekendMultiplier = isWeekend ? 1.3 : 1.0;

        const dailyTarget = Math.round((branchSalesTarget / 7) * recencyMultiplier * weekendMultiplier);

        for (let i = 0; i < dailyTarget; i++) {
          // Random time during business hours (8 AM to 10 PM)
          const hour = getRandomInt(8, 21);
          const minute = getRandomInt(0, 59);
          const second = getRandomInt(0, 59);
          const saleDateTime = new Date(saleDate);
          saleDateTime.setHours(hour, minute, second);

          // Select random customer (80% chance) or walk-in
          const customer = Math.random() > 0.2 && branchCustomers.length > 0
            ? getRandomElement(branchCustomers)
            : null;

          // Select cashier
          const cashier = branchCashiers.length > 0
            ? getRandomElement(branchCashiers)
            : cashiers[0];

          // Generate sale items (2-8 products)
          const itemCount = getRandomInt(2, 8);
          const saleItems = [];
          let subtotal = 0;
          let totalTax = 0;

          for (let j = 0; j < itemCount; j++) {
            const product = getRandomElement(branchProducts);
            const branchStock = product.stockByBranch.find(
              s => s.branch.toString() === branch._id.toString()
            );

            if (!branchStock || branchStock.quantity === 0) continue;

            const quantity = getRandomInt(1, Math.min(3, branchStock.quantity));
            const unitPrice = product.sellingPrice;
            const itemTotal = unitPrice * quantity;
            const discount = Math.random() > 0.8 ? getRandomInt(5, 15) : 0;
            const discountAmount = (itemTotal * discount) / 100;
            const taxableAmount = itemTotal - discountAmount;
            const taxAmount = (taxableAmount * product.gstRate) / 100;

            saleItems.push({
              product: product._id,
              productName: product.name,
              sku: product.sku,
              quantity,
              unitPrice,
              discount,
              discountAmount,
              taxableAmount,
              taxRate: product.gstRate,
              taxAmount,
              total: taxableAmount + taxAmount
            });

            subtotal += itemTotal;
            totalTax += taxAmount;
          }

          if (saleItems.length === 0) continue;

          // Calculate totals
          const totalDiscount = saleItems.reduce((sum, item) => sum + item.discountAmount, 0);
          const totalAmount = subtotal - totalDiscount + totalTax;

          // Payment method
          const paymentMethods = ['cash', 'card', 'upi', 'netbanking'];
          const paymentWeights = [0.15, 0.45, 0.35, 0.05]; // Realistic distribution
          const rand = Math.random();
          let paymentMethod;
          let cumulative = 0;
          for (let k = 0; k < paymentMethods.length; k++) {
            cumulative += paymentWeights[k];
            if (rand <= cumulative) {
              paymentMethod = paymentMethods[k];
              break;
            }
          }

          const sale = {
            saleNumber: generateSaleNumber(saleDateTime, globalSequence++),
            branch: branch._id,
            customer: customer?._id,
            items: saleItems,
            subtotal,
            totalDiscount,
            totalTax,
            total: totalAmount,
            paymentMethod,
            paymentReference: generatePaymentReference(paymentMethod),
            status: 'completed',
            createdBy: cashier._id,
            createdAt: saleDateTime,
            updatedAt: saleDateTime
          };

          sales.push(sale);
          branchRevenue += totalAmount;
        }
      }

      // Insert sales for this branch
      if (sales.length > 0) {
        await Sale.insertMany(sales);
        console.log(`   ✅ Added ${sales.length} sales, Revenue: ₹${Math.round(branchRevenue).toLocaleString('en-IN')}`);
        totalSalesAdded += sales.length;
        totalRevenue += branchRevenue;
      }
    }

    console.log('\n📈 Recent Sales Summary:');
    console.log(`   📊 Total Sales Added: ${totalSalesAdded}`);
    console.log(`   💰 Total Revenue: ₹${Math.round(totalRevenue).toLocaleString('en-IN')}`);
    console.log('   📅 Date Range: Last 7 days');

    console.log('\n✅ Recent sales data added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addRecentSales();
