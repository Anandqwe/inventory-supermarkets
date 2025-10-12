require('dotenv').config();

async function testProductsAPI() {
  try {
    // Use credentials from environment variables or defaults
    const testEmail = process.env.TEST_USER_EMAIL || 'cashier1.andheri@mumbaisupermart.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Mumbai@123456';

    // First, login as cashier
    console.log('🔐 Logging in as Cashier...\n');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    const user = loginData.data.user;

    console.log('✅ Login successful!');
    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Branch: ${user.branch?.name || 'NO BRANCH'}`);
    console.log('');

    // Now fetch products
    console.log('📦 Fetching products...\n');
    const productsResponse = await fetch('http://localhost:5000/api/products?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const productsData = await productsResponse.json();

    console.log('📊 Full API Response:');
    console.log(JSON.stringify(productsData, null, 2));
    console.log('');

    const { products, pagination } = productsData.data;

    console.log('✅ Products API Response:');
    console.log(`   Total Products: ${pagination.totalItems}`);
    console.log(`   Current Page: ${pagination.currentPage}`);
    console.log(`   Total Pages: ${pagination.totalPages}`);
    console.log('');

    if (products.length > 0) {
      console.log('   Sample Products:');
      products.slice(0, 3).forEach(product => {
        console.log(`   - ${product.name} (SKU: ${product.sku})`);
        console.log(`     Price: ₹${product.pricing.sellingPrice}`);
        console.log(`     Stock: ${product.totalStock || 0}`);
      });
    } else {
      console.log('   ❌ No products returned!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProductsAPI();
