#!/usr/bin/env node

/**
 * Script to create database indexes manually
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { createIndexes } = require('../src/utils/dbOptimization');

async function main() {
  try {
    console.log('🔍 Creating database indexes...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create indexes
    await createIndexes();
    
    console.log('✅ Database indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

main();