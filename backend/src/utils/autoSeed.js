/**
 * Auto Seed Utility
 * Automatically seeds the database on startup if needed
 */
const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('./logger');
const User = require('../models/User');
const Product = require('../models/Product');
const Branch = require('../models/Branch');

/**
 * Check if database needs seeding
 * @returns {Promise<boolean>}
 */
async function needsSeeding() {
  try {
    // Check if critical collections have data
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const branchCount = await Branch.countDocuments();

    // If any critical collection is empty, we need seeding
    return userCount === 0 || productCount === 0 || branchCount === 0;
  } catch (error) {
    logger.error('Error checking if seeding is needed', { error: error.message });
    return false;
  }
}

/**
 * Run the seed:master script
 * @returns {Promise<void>}
 */
function runSeedScript() {
  return new Promise((resolve, reject) => {
    logger.info('🌱 Starting automatic database seeding...');
    
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'seedMasterData.js');
    const seedProcess = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..')
    });

    seedProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('✅ Automatic seeding completed successfully');
        resolve();
      } else {
        logger.error(`❌ Automatic seeding failed with code ${code}`);
        reject(new Error(`Seeding process exited with code ${code}`));
      }
    });

    seedProcess.on('error', (error) => {
      logger.error('❌ Failed to start seeding process', { error: error.message });
      reject(error);
    });
  });
}

/**
 * Auto seed database if needed
 * @returns {Promise<void>}
 */
async function autoSeed() {
  try {
    // Check if auto-seeding is enabled (default: true in development)
    const autoSeedEnabled = process.env.AUTO_SEED !== 'false';
    
    if (!autoSeedEnabled) {
      logger.info('Auto-seeding is disabled (AUTO_SEED=false)');
      return;
    }

    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    // Check if seeding is needed
    const shouldSeed = await needsSeeding();
    
    if (shouldSeed) {
      logger.info('📊 Empty database detected, initiating automatic seeding...');
      await runSeedScript();
    } else {
      logger.info('✓ Database already seeded, skipping automatic seeding');
    }
  } catch (error) {
    logger.error('Error during auto-seed', { error: error.message });
    // Don't throw - let the server start even if seeding fails
  }
}

module.exports = {
  autoSeed,
  needsSeeding,
  runSeedScript
};
