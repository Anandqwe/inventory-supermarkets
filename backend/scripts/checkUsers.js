const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const users = await User.find({}).select('email role isActive');
    console.log(`\nTotal users: ${users.length}\n`);
    users.forEach(u => {
      console.log(`${u.isActive ? '✅' : '❌'} ${u.role} - ${u.email}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
