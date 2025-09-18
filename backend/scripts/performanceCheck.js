#!/usr/bin/env node

/**
 * Performance check and health monitoring script
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { initRedis, cache } = require('../src/config/cache');
const { performanceMonitor } = require('../src/utils/dbOptimization');

async function checkDatabasePerformance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection: OK');
    
    const stats = await performanceMonitor.getStats();
    console.log('📊 Database stats:', JSON.stringify(stats, null, 2));
    
    const health = await performanceMonitor.healthCheck();
    console.log('🏥 Database health:', health);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

async function checkCachePerformance() {
  try {
    await initRedis();
    
    const health = await cache.healthCheck();
    console.log('🗃️ Cache health:', health);
    
    const stats = cache.getStats();
    console.log('📈 Cache stats:', JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.error('❌ Cache check failed:', error.message);
  }
}

async function checkSystemResources() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  console.log('💾 Memory usage:');
  console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('⚡ CPU usage:');
  console.log(`  User: ${(cpuUsage.user / 1000000).toFixed(2)}s`);
  console.log(`  System: ${(cpuUsage.system / 1000000).toFixed(2)}s`);
}

async function main() {
  console.log('🔍 Running performance check...\n');
  
  console.log('1. Checking system resources...');
  checkSystemResources();
  console.log('');
  
  console.log('2. Checking database performance...');
  await checkDatabasePerformance();
  console.log('');
  
  console.log('3. Checking cache performance...');
  await checkCachePerformance();
  console.log('');
  
  console.log('✅ Performance check completed');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Performance check failed:', error);
  process.exit(1);
});