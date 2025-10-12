const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Branch = require('../src/models/Branch');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Sale = require('../src/models/Sale');
const Category = require('../src/models/Category');

// Validation results storage
const validationResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper functions
function logSuccess(message) {
  console.log(`✅ ${message}`);
  validationResults.passed.push(message);
}

function logError(message, details = null) {
  console.log(`❌ ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  validationResults.failed.push({ message, details });
}

function logWarning(message, details = null) {
  console.log(`⚠️  ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  validationResults.warnings.push({ message, details });
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

// Validation functions
async function validateBasicDataIntegrity() {
  logSection('1️⃣  BASIC DATA INTEGRITY');

  try {
    // Check branches
    const branches = await Branch.find({});
    if (branches.length === 3) {
      logSuccess(`Found 3 branches (expected 3)`);
    } else {
      logError(`Found ${branches.length} branches (expected 3)`);
    }

    // Check products
    const products = await Product.find({});
    if (products.length >= 500) {
      logSuccess(`Found ${products.length} products (expected 500+)`);
    } else {
      logWarning(`Found ${products.length} products (expected 500+)`);
    }

    // Check customers
    const customers = await Customer.find({});
    if (customers.length === 500) {
      logSuccess(`Found ${customers.length} customers (expected 500)`);
    } else {
      logWarning(`Found ${customers.length} customers (expected 500)`, { actual: customers.length });
    }

    // Check inventory
    const productsWithInventory = await Product.find({ 'stockByBranch.0': { $exists: true } });
    if (productsWithInventory.length > 0) {
      logSuccess(`Found ${productsWithInventory.length} products with inventory data`);
    } else {
      logError('No inventory data found in products');
    }

    // Check sales
    const sales = await Sale.find({});
    if (sales.length >= 1000) {
      logSuccess(`Found ${sales.length} sales transactions (expected 1000+)`);
    } else {
      logWarning(`Found ${sales.length} sales transactions (expected 1000+)`);
    }

  } catch (error) {
    logError('Basic data integrity check failed', error.message);
  }
}

async function validateOrphanedReferences() {
  logSection('2️⃣  ORPHANED REFERENCES CHECK');

  try {
    // Check products with invalid categories
    const productsWithCategories = await Product.find({}).populate('category');
    const productsWithoutCategory = productsWithCategories.filter(p => !p.category);
    if (productsWithoutCategory.length === 0) {
      logSuccess('All products have valid category references');
    } else {
      logError(`Found ${productsWithoutCategory.length} products with invalid categories`);
    }

    // Check products with invalid branch references in stockByBranch
    const productsWithStock = await Product.find({ 'stockByBranch.0': { $exists: true } });
    const branches = await Branch.find({});
    const branchIds = branches.map(b => b._id.toString());
    
    let invalidBranchRefs = 0;
    for (const product of productsWithStock) {
      for (const stock of product.stockByBranch) {
        if (!branchIds.includes(stock.branch.toString())) {
          invalidBranchRefs++;
        }
      }
    }
    
    if (invalidBranchRefs === 0) {
      logSuccess('All product inventory has valid branch references');
    } else {
      logError(`Found ${invalidBranchRefs} invalid branch references in product inventory`);
    }

    // Check sales with invalid customers
    const sales = await Sale.find({}).populate('customer');
    const salesWithoutCustomer = sales.filter(s => !s.customer);
    if (salesWithoutCustomer.length === 0) {
      logSuccess('All sales have valid customer references');
    } else {
      logWarning(`Found ${salesWithoutCustomer.length} sales with invalid customers (walk-ins are OK)`);
    }

    // Check sales with invalid branches
    const salesWithBranches = await Sale.find({}).populate('branch');
    const salesWithoutBranch = salesWithBranches.filter(s => !s.branch);
    if (salesWithoutBranch.length === 0) {
      logSuccess('All sales have valid branch references');
    } else {
      logError(`Found ${salesWithoutBranch.length} sales with invalid branches`);
    }

  } catch (error) {
    logError('Orphaned references check failed', error.message);
  }
}

async function validateInventoryValues() {
  logSection('3️⃣  INVENTORY VALUE CONSISTENCY');

  try {
    const branches = await Branch.find({});
    const products = await Product.find({});
    
    for (const branch of branches) {
      let calculatedValue = 0;
      let calculatedUnits = 0;
      let productCount = 0;
      
      for (const product of products) {
        const branchStock = product.stockByBranch.find(s => s.branch.toString() === branch._id.toString());
        if (branchStock && branchStock.quantity > 0) {
          const costPrice = product.pricing?.costPrice || 0;
          const itemValue = branchStock.quantity * costPrice;
          calculatedValue += itemValue;
          calculatedUnits += branchStock.quantity;
          productCount++;
        }
      }
      
      console.log(`\n📍 ${branch.name}:`);
      console.log(`   Total Products: ${productCount}`);
      console.log(`   Total Units: ${calculatedUnits.toLocaleString('en-IN')}`);
      console.log(`   Inventory Value: ₹${calculatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      
      // Check for negative stock
      let negativeStockCount = 0;
      let belowReorderCount = 0;
      
      for (const product of products) {
        const branchStock = product.stockByBranch.find(s => s.branch.toString() === branch._id.toString());
        if (branchStock) {
          if (branchStock.quantity < 0) {
            negativeStockCount++;
          }
          if (branchStock.quantity <= branchStock.reorderLevel) {
            belowReorderCount++;
          }
        }
      }
      
      if (negativeStockCount === 0) {
        logSuccess(`No negative stock items in ${branch.name}`);
      } else {
        logError(`Found ${negativeStockCount} items with negative stock in ${branch.name}`);
      }
      
      if (belowReorderCount > 0) {
        logWarning(`${belowReorderCount} items below reorder level in ${branch.name}`);
      }
    }
    
    logSuccess('Inventory value calculations completed');

  } catch (error) {
    logError('Inventory value validation failed', error.message);
  }
}

async function validateSalesCalculations() {
  logSection('4️⃣  SALES CALCULATIONS CONSISTENCY');

  try {
    const sales = await Sale.find({});
    let totalCalculationErrors = 0;
    
    for (const sale of sales) {
      // Validate subtotal
      const calculatedSubtotal = sale.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      const subtotalDiff = Math.abs(sale.subtotal - calculatedSubtotal);
      if (subtotalDiff > 0.01) {
        totalCalculationErrors++;
        if (totalCalculationErrors <= 5) { // Show first 5 errors
          logError(`Sale ${sale.invoiceNumber}: Subtotal mismatch`, {
            stored: sale.subtotal,
            calculated: calculatedSubtotal,
            diff: subtotalDiff
          });
        }
      }
      
      // Validate tax
      const calculatedTax = sale.items.reduce((sum, item) => {
        return sum + (item.taxAmount || 0);
      }, 0);
      
      const taxDiff = Math.abs(sale.tax - calculatedTax);
      if (taxDiff > 0.01) {
        totalCalculationErrors++;
        if (totalCalculationErrors <= 5) {
          logError(`Sale ${sale.invoiceNumber}: Tax mismatch`, {
            stored: sale.tax,
            calculated: calculatedTax,
            diff: taxDiff
          });
        }
      }
      
      // Validate total
      const calculatedTotal = sale.subtotal + sale.tax - (sale.discount || 0);
      const totalDiff = Math.abs(sale.total - calculatedTotal);
      if (totalDiff > 0.01) {
        totalCalculationErrors++;
        if (totalCalculationErrors <= 5) {
          logError(`Sale ${sale.invoiceNumber}: Total mismatch`, {
            stored: sale.total,
            calculated: calculatedTotal,
            diff: totalDiff
          });
        }
      }
    }
    
    if (totalCalculationErrors === 0) {
      logSuccess(`All ${sales.length} sales have correct calculations`);
    } else {
      logError(`Found ${totalCalculationErrors} sales with calculation errors (showing first 5)`);
    }

  } catch (error) {
    logError('Sales calculations validation failed', error.message);
  }
}

async function validateRevenueAndProfit() {
  logSection('5️⃣  REVENUE & PROFIT CONSISTENCY');

  try {
    const branches = await Branch.find({});
    let systemTotalRevenue = 0;
    let systemTotalProfit = 0;
    let systemTotalSales = 0;
    
    for (const branch of branches) {
      const branchSales = await Sale.find({ branch: branch._id });
      
      const branchRevenue = branchSales.reduce((sum, sale) => sum + sale.total, 0);
      const branchProfit = branchSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      const branchSalesCount = branchSales.length;
      
      systemTotalRevenue += branchRevenue;
      systemTotalProfit += branchProfit;
      systemTotalSales += branchSalesCount;
      
      console.log(`\n📍 ${branch.name}:`);
      console.log(`   Sales Count: ${branchSalesCount}`);
      console.log(`   Revenue: ₹${branchRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`   Profit: ₹${branchProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`   Profit Margin: ${((branchProfit / branchRevenue) * 100).toFixed(2)}%`);
    }
    
    console.log('\n📊 System Totals:');
    console.log(`   Total Sales: ${systemTotalSales}`);
    console.log(`   Total Revenue: ₹${systemTotalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`   Total Profit: ₹${systemTotalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`   Overall Profit Margin: ${((systemTotalProfit / systemTotalRevenue) * 100).toFixed(2)}%`);
    
    // Validate profit margin is within expected range (15-25%)
    const overallMargin = (systemTotalProfit / systemTotalRevenue) * 100;
    if (overallMargin >= 15 && overallMargin <= 25) {
      logSuccess(`Profit margin ${overallMargin.toFixed(2)}% is within expected range (15-25%)`);
    } else {
      logWarning(`Profit margin ${overallMargin.toFixed(2)}% is outside expected range (15-25%)`);
    }

  } catch (error) {
    logError('Revenue and profit validation failed', error.message);
  }
}

async function validateCustomerData() {
  logSection('6️⃣  CUSTOMER DATA CONSISTENCY');

  try {
    const customers = await Customer.find({});
    
    let mismatchCount = 0;
    for (const customer of customers) {
      // Validate that customer's totalSpent matches their sales
      const customerSales = await Sale.find({ customer: customer._id });
      const actualTotalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      
      const diff = Math.abs(customer.totalSpent - actualTotalSpent);
      if (diff > 0.01) {
        mismatchCount++;
        if (mismatchCount <= 5) {
          logError(`Customer ${customer.customerNumber}: Total spent mismatch`, {
            stored: customer.totalSpent,
            calculated: actualTotalSpent,
            diff: diff
          });
        }
      }
      
      // Validate purchase count
      if (customer.totalPurchases !== customerSales.length) {
        mismatchCount++;
        if (mismatchCount <= 5) {
          logError(`Customer ${customer.customerNumber}: Purchase count mismatch`, {
            stored: customer.totalPurchases,
            actual: customerSales.length
          });
        }
      }
    }
    
    if (mismatchCount === 0) {
      logSuccess(`All ${customers.length} customers have consistent purchase data`);
    } else {
      logWarning(`Found ${mismatchCount} customers with data inconsistencies (showing first 5)`);
      logWarning('Note: Mismatches are expected as customer data is pre-generated for seeding');
    }

  } catch (error) {
    logError('Customer data validation failed', error.message);
  }
}

async function validateProductPricing() {
  logSection('7️⃣  PRODUCT PRICING VALIDATION');

  try {
    const products = await Product.find({}).populate('category');
    
    let pricingErrors = 0;
    
    for (const product of products) {
      const costPrice = product.pricing?.costPrice || 0;
      const sellingPrice = product.pricing?.sellingPrice || 0;
      
      // Check that selling price > cost price
      if (sellingPrice <= costPrice) {
        pricingErrors++;
        if (pricingErrors <= 5) {
          logError(`Product ${product.sku}: Selling price (₹${sellingPrice}) <= Cost price (₹${costPrice})`);
        }
      }
      
      // Check profit margin is positive
      const margin = ((sellingPrice - costPrice) / costPrice) * 100;
      if (margin < 0) {
        pricingErrors++;
        if (pricingErrors <= 5) {
          logError(`Product ${product.sku}: Negative margin ${margin.toFixed(2)}%`);
        }
      }
      
      // Check GST rate matches category
      if (product.category && product.category.gstRate && product.pricing?.gstRate !== product.category.gstRate) {
        pricingErrors++;
        if (pricingErrors <= 5) {
          logWarning(`Product ${product.sku}: GST rate ${product.pricing?.gstRate}% doesn't match category GST ${product.category.gstRate}%`);
        }
      }
    }
    
    if (pricingErrors === 0) {
      logSuccess(`All ${products.length} products have valid pricing`);
    } else {
      logWarning(`Found ${pricingErrors} products with pricing issues (showing first 5)`);
    }

  } catch (error) {
    logError('Product pricing validation failed', error.message);
  }
}

async function validateDataDistribution() {
  logSection('8️⃣  DATA DISTRIBUTION ANALYSIS');

  try {
    const branches = await Branch.find({});
    const products = await Product.find({});
    
    // Customer distribution
    console.log('\n👥 Customer Distribution:');
    for (const branch of branches) {
      const count = await Customer.countDocuments({ registeredBranch: branch._id });
      const percentage = (count / 500) * 100;
      console.log(`   ${branch.name}: ${count} (${percentage.toFixed(1)}%)`);
    }
    
    // Inventory distribution
    console.log('\n📦 Inventory Distribution:');
    for (const branch of branches) {
      let count = 0;
      for (const product of products) {
        const branchStock = product.stockByBranch.find(s => s.branch.toString() === branch._id.toString());
        if (branchStock && branchStock.quantity > 0) {
          count++;
        }
      }
      console.log(`   ${branch.name}: ${count} items`);
    }
    
    // Sales distribution
    console.log('\n💰 Sales Distribution:');
    const totalSales = await Sale.countDocuments({});
    for (const branch of branches) {
      const count = await Sale.countDocuments({ branch: branch._id });
      const percentage = (count / totalSales) * 100;
      console.log(`   ${branch.name}: ${count} (${percentage.toFixed(1)}%)`);
    }
    
    // Payment method distribution
    console.log('\n💳 Payment Method Distribution:');
    const paymentMethods = ['cash', 'card', 'upi', 'netbanking'];
    for (const method of paymentMethods) {
      const count = await Sale.countDocuments({ paymentMethod: method });
      const percentage = (count / totalSales) * 100;
      console.log(`   ${method.toUpperCase()}: ${count} (${percentage.toFixed(1)}%)`);
    }
    
    logSuccess('Data distribution analysis completed');

  } catch (error) {
    logError('Data distribution validation failed', error.message);
  }
}

// Main validation function
async function runValidation() {
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(80));
  console.log('  🔍 DATA VALIDATION SUITE - Mumbai Supermarket System');
  console.log('='.repeat(80) + '\n');
  
  console.log(`⏰ Started at: ${new Date().toLocaleString('en-IN')}`);
  console.log(`🔗 Database: ${process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || 'MongoDB Atlas'}\n`);
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Run all validation checks
    await validateBasicDataIntegrity();
    await validateOrphanedReferences();
    await validateInventoryValues();
    await validateSalesCalculations();
    await validateRevenueAndProfit();
    await validateCustomerData();
    await validateProductPricing();
    await validateDataDistribution();
    
    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logSection('📊 VALIDATION SUMMARY');
    
    console.log(`✅ Passed: ${validationResults.passed.length}`);
    console.log(`⚠️  Warnings: ${validationResults.warnings.length}`);
    console.log(`❌ Failed: ${validationResults.failed.length}`);
    console.log(`⏱️  Duration: ${duration}s\n`);
    
    if (validationResults.failed.length === 0) {
      console.log('🎉 All critical validations passed!');
      console.log('✨ Your database is consistent and ready to use.\n');
    } else {
      console.log('⚠️  Some validations failed. Please review the errors above.\n');
    }
    
    if (validationResults.warnings.length > 0) {
      console.log('💡 Warnings are informational and may not require action.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Validation suite failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run validation if called directly
if (require.main === module) {
  runValidation()
    .then(() => {
      process.exit(validationResults.failed.length === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = runValidation;
