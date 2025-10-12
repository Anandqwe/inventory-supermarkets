const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Logging helpers
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  console.log('\n' + '='.repeat(80));
  log(`  ${message}`, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

// Seed step configuration
const seedSteps = [
  {
    name: 'Branches',
    description: 'Creating 3 Mumbai branch locations',
    script: 'seedBranchesMumbai.js',
    critical: true
  },
  {
    name: 'Users',
    description: 'Creating 18 users across 6 roles',
    script: 'seedUsersEnhanced.js',
    critical: true
  },
  {
    name: 'Products',
    description: 'Creating 587 Indian products with GST rates',
    script: 'seedProductsRealistic.js',
    critical: true
  },
  {
    name: 'Customers',
    description: 'Creating 500 customers in 4 tiers',
    script: 'seedCustomersSegmented.js',
    critical: false
  },
  {
    name: 'Inventory',
    description: 'Distributing ₹81L inventory across branches',
    script: 'seedInventoryDistributed.js',
    critical: false
  },
  {
    name: 'Sales',
    description: 'Generating 1750 sales transactions',
    script: 'seedSalesConsistent.js',
    critical: false
  },
  {
    name: 'Update Sales Dates',
    description: 'Updating sales dates to end today',
    script: 'updateSalesDatesRaw.js',
    critical: false
  }
];

// Execute a seed script as child process
function runSeedScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);

    // Run with automatic "yes" responses for prompts
    const child = spawn('node', [scriptPath], {
      stdio: ['pipe', 'inherit', 'inherit'], // pipe stdin, inherit stdout/stderr
      cwd: path.join(__dirname, '..')
    });

    // Auto-answer "yes" to any prompts
    if (child.stdin) {
      child.stdin.write('yes\n');
      child.stdin.end();
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Track execution results
const executionResults = [];

// Main orchestrator function
async function runMasterSeed() {
  const startTime = Date.now();

  logSection('🚀 MASTER SEED ORCHESTRATOR - Mumbai Supermarket System');

  log('📋 Seed Plan:', colors.bright);
  seedSteps.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step.name}: ${step.description}`);
  });

  logInfo(`\n⏰ Started at: ${new Date().toLocaleString('en-IN')}`);
  logInfo(`🔗 Database: ${process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || 'MongoDB Atlas'}\n`);

  let allSuccess = true;
  let completedSteps = 0;

  for (let i = 0; i < seedSteps.length; i++) {
    const step = seedSteps[i];
    const stepNumber = i + 1;

    logSection(`STEP ${stepNumber}/${seedSteps.length}: ${step.name}`);
    logInfo(step.description);

    const stepStartTime = Date.now();

    try {
      // Execute the seed script
      await runSeedScript(step.script);

      const stepDuration = ((Date.now() - stepStartTime) / 1000).toFixed(2);

      executionResults.push({
        step: step.name,
        status: 'SUCCESS',
        duration: stepDuration,
        error: null
      });

      completedSteps++;
      logSuccess(`${step.name} completed in ${stepDuration}s`);

    } catch (error) {
      const stepDuration = ((Date.now() - stepStartTime) / 1000).toFixed(2);

      executionResults.push({
        step: step.name,
        status: 'FAILED',
        duration: stepDuration,
        error: error.message
      });

      logError(`${step.name} failed after ${stepDuration}s`);
      logError(`Error: ${error.message}`);

      if (step.critical) {
        logError(`\n💥 CRITICAL FAILURE: Cannot continue without ${step.name}`);
        allSuccess = false;
        break;
      } else {
        logWarning(`\n⚠️  Non-critical failure in ${step.name}, continuing...`);
        allSuccess = false;
      }
    }
  }

  // Final Summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  logSection('📊 EXECUTION SUMMARY');

  console.log('Step Results:');
  executionResults.forEach((result, index) => {
    const statusIcon = result.status === 'SUCCESS' ? '✅' : '❌';
    const statusColor = result.status === 'SUCCESS' ? colors.green : colors.red;
    log(`   ${statusIcon} ${index + 1}. ${result.step}: ${result.status} (${result.duration}s)`, statusColor);
    if (result.error) {
      log(`      Error: ${result.error}`, colors.dim);
    }
  });

  console.log('\n' + '-'.repeat(80));
  log(`\n   Total Steps: ${seedSteps.length}`, colors.bright);
  log(`   Completed: ${completedSteps}`, completedSteps === seedSteps.length ? colors.green : colors.yellow);
  log(`   Failed: ${seedSteps.length - completedSteps}`, colors.red);
  log(`   Total Duration: ${totalDuration}s`, colors.cyan);
  log(`   Finished at: ${new Date().toLocaleString('en-IN')}`, colors.cyan);

  if (allSuccess && completedSteps === seedSteps.length) {
    console.log('\n' + '='.repeat(80));
    logSuccess('🎉 ALL SEED OPERATIONS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');

    // Print final statistics
    logSection('📈 SYSTEM STATISTICS');
    console.log('   🏢 Branches: 3 (Mumbai locations)');
    console.log('   👥 Users: 18 (6 roles)');
    console.log('   📦 Products: 587 (9 categories, 68 brands)');
    console.log('   👨‍👩‍👧‍👦 Customers: 500 (4 tiers)');
    console.log('   📊 Inventory Value: ₹81,08,900');
    console.log('   💰 Sales Revenue: ₹2,31,10,440');
    console.log('   📈 Sales Transactions: 1,750');
    console.log('   💵 Profit Margin: ~20.1%\n');

    logSuccess('✨ Your Mumbai Supermarket System is ready!');
    logInfo('🚀 Start the backend: npm run dev');
    logInfo('🌐 Start the frontend: cd ../frontend && npm run dev\n');

    return true;
  } else {
    console.log('\n' + '='.repeat(80));
    logError('⚠️  SEED PROCESS COMPLETED WITH ERRORS');
    console.log('='.repeat(80) + '\n');

    if (completedSteps > 0) {
      logWarning(`✅ ${completedSteps} steps completed successfully`);
      logWarning(`❌ ${seedSteps.length - completedSteps} steps failed\n`);
    }

    logInfo('💡 Troubleshooting Tips:');
    console.log('   1. Check MongoDB Atlas connection');
    console.log('   2. Verify .env file configuration');
    console.log('   3. Review error messages above');
    console.log('   4. Run individual seed scripts to identify issues:');
    executionResults
      .filter(r => r.status === 'FAILED')
      .forEach(r => {
        console.log(`      npm run seed:${r.step.toLowerCase()}`);
      });
    console.log('   5. Clear database and try again: npm run db:clear\n');

    return false;
  }
}

// Cleanup helper (optional - for rollback)
async function clearAllData() {
  const mongoose = require('mongoose');

  logSection('🗑️  DATABASE CLEANUP');

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const collections = [
      'branches',
      'users',
      'categories',
      'brands',
      'units',
      'suppliers',
      'products',
      'customers',
      'sales'
    ];

    logInfo('Clearing existing data...\n');

    for (const collection of collections) {
      try {
        const result = await mongoose.connection.db.collection(collection).deleteMany({});
        console.log(`   ✅ ${collection}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        console.log(`   ⚠️  ${collection}: Collection not found or empty`);
      }
    }

    await mongoose.connection.close();
    logSuccess('\n✅ Database cleanup completed\n');

  } catch (error) {
    logError(`\n❌ Cleanup failed: ${error.message}\n`);
    throw error;
  }
}

// Command line argument handling
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear') || args.includes('-c');
const skipPrompt = args.includes('--yes') || args.includes('-y');

// Main execution
async function main() {
  try {
    // Show warning for clear operation
    if (shouldClear) {
      logWarning('\n⚠️  WARNING: This will DELETE ALL EXISTING DATA!\n');

      if (!skipPrompt) {
        logInfo('To proceed, run: npm run seed:master -- --clear --yes\n');
        process.exit(0);
      }

      await clearAllData();
    }

    // Run the master seed
    const success = await runMasterSeed();

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    logError('💥 FATAL ERROR');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logError('\n💥 Unhandled Promise Rejection:');
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError('\n💥 Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { runMasterSeed, clearAllData };
