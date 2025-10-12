require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

/**
 * Quick test to verify admin user and password
 */
async function testAdminLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@mumbaisupermart.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('\n📧 Admin Email:', admin.email);
    console.log('👤 Full Name:', admin.fullName);
    console.log('🔑 Role:', admin.role);
    console.log('✅ Active:', admin.isActive);
    console.log('🔒 Password Hash (first 50 chars):', admin.password.substring(0, 50));

    // Test password
    const testPassword = 'Mumbai@123456';
    console.log('\n🧪 Testing password:', testPassword);
    
    // Method 1: Using bcrypt directly
    const isValidBcrypt = await bcrypt.compare(testPassword, admin.password);
    console.log('   bcrypt.compare result:', isValidBcrypt);

    // Method 2: Using user model method
    const isValidMethod = await admin.comparePassword(testPassword);
    console.log('   admin.comparePassword result:', isValidMethod);

    if (isValidBcrypt && isValidMethod) {
      console.log('\n✅ Password is correct and working!');
    } else {
      console.log('\n❌ Password verification failed!');
      console.log('   This means either:');
      console.log('   1. The password was not hashed correctly during seeding');
      console.log('   2. The comparePassword method is not working');
    }

    // Test with wrong password
    const wrongPassword = 'WrongPassword123';
    const isWrongValid = await admin.comparePassword(wrongPassword);
    console.log('\n🧪 Testing wrong password:', wrongPassword);
    console.log('   Result:', isWrongValid, '(should be false)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAdminLogin();
