const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');
    
    console.log('Clearing database...');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database cleared successfully!');
    
    console.log('Database is now empty.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

clearDatabase();