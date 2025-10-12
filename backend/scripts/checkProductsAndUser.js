require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Branch = require('../src/models/Branch');
const database = require('../src/config/database');

async function checkProductsAndUser() {
  try {
    await database.connect();

    console.log('\n🔍 Checking Cashier User...\n');
    const cashier = await User.findOne({ email: 'cashier1.andheri@mumbaisupermart.com' }).populate('branch');

    if (!cashier) {
      console.log('❌ Cashier not found!');
    } else {
      console.log('✅ Cashier found:');
      console.log(`   Name: ${cashier.firstName} ${cashier.lastName}`);
      console.log(`   Email: ${cashier.email}`);
      console.log(`   Role: ${cashier.role}`);
      console.log(`   Branch ID: ${cashier.branch?._id || 'NO BRANCH'}`);
      console.log(`   Branch Name: ${cashier.branch?.name || 'NO BRANCH'}`);
      console.log(`   Branch Code: ${cashier.branch?.code || 'NO BRANCH'}`);
      console.log(`   Active: ${cashier.isActive}`);
      console.log('');

      // Check products for this branch
      if (cashier.branch) {
        console.log('🔍 Checking Products for this Branch...\n');
        const products = await Product.find({
          'stockByBranch.branch': cashier.branch._id,
          isActive: true
        }).limit(5);

        console.log(`   Total products with branch stock: ${products.length}`);
        if (products.length > 0) {
          console.log('\n   Sample Products:');
          products.forEach(product => {
            const branchStock = product.stockByBranch.find(s => s.branch.equals(cashier.branch._id));
            console.log(`   - ${product.name} (SKU: ${product.sku})`);
            console.log(`     Stock: ${branchStock?.quantity || 0}`);
          });
        } else {
          console.log('   ❌ No products found for this branch!');
        }
      }
    }

    console.log('\n🔍 Checking Total Products...\n');
    const totalProducts = await Product.countDocuments({ isActive: true });
    console.log(`   Total active products: ${totalProducts}`);

    console.log('\n🔍 Checking Total Branches...\n');
    const branches = await Branch.find();
    console.log(`   Total branches: ${branches.length}`);
    branches.forEach(branch => {
      console.log(`   - ${branch.code}: ${branch.name}`);
    });

    console.log('\n✅ Check completed!');

    setTimeout(() => {
      mongoose.connection.close();
      process.exit(0);
    }, 1000);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProductsAndUser();
