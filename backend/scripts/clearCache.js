#!/usr/bin/env node

/**
 * Script to clear cache
 */

require('dotenv').config();
const { cache, initRedis } = require('../src/config/cache');

async function main() {
  try {
    console.log('🗑️ Clearing cache...');
    
    // Initialize Redis connection
    await initRedis();
    
    // Clear all cache
    await cache.flush();
    
    console.log('✅ Cache cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

main();