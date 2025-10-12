/**
 * Migration Script: Update User Permissions Format
 *
 * This script updates all existing users' permissions from colon notation to dot notation
 * and ensures all roles have the correct permission sets.
 *
 * Run with: node scripts/migrateUserPermissions.js
 */

const mongoose = require('mongoose');
const User = require('../src/models/User');
const { ROLE_PERMISSIONS } = require('../../shared/permissions');
require('dotenv').config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

/**
 * Convert colon notation to dot notation
 * @param {string} permission - Permission in colon notation (e.g., 'products:read')
 * @returns {string} Permission in dot notation (e.g., 'products.read')
 */
function convertPermissionFormat(permission) {
  return permission.replace(':', '.');
}

/**
 * Migrate a single user's permissions
 * @param {Object} user - User document
 * @returns {Object} Migration result
 */
async function migrateUser(user) {
  const result = {
    userId: user._id,
    email: user.email,
    role: user.role,
    changes: [],
    errors: []
  };

  try {
    let needsUpdate = false;
    let newPermissions = [];

    // Check if user has permissions in old format (colon notation)
    if (user.permissions && user.permissions.length > 0) {
      const hasColonNotation = user.permissions.some(p => p.includes(':'));

      if (hasColonNotation) {
        // Convert existing permissions to dot notation
        newPermissions = user.permissions.map(p => convertPermissionFormat(p));
        result.changes.push(`Converted ${user.permissions.length} permissions from colon to dot notation`);
        needsUpdate = true;
      }
    }

    // Check if role has default permissions defined
    if (ROLE_PERMISSIONS[user.role]) {
      const defaultPermissions = ROLE_PERMISSIONS[user.role];

      // If user has no permissions or outdated permissions, set defaults
      if (!user.permissions || user.permissions.length === 0) {
        newPermissions = defaultPermissions;
        result.changes.push(`Added ${defaultPermissions.length} default permissions for role: ${user.role}`);
        needsUpdate = true;
      } else {
        // Merge with default permissions (in case new permissions were added)
        const currentPermissions = new Set(newPermissions.length > 0 ? newPermissions : user.permissions);
        const missingPermissions = defaultPermissions.filter(p => !currentPermissions.has(p));

        if (missingPermissions.length > 0) {
          newPermissions = [...(newPermissions.length > 0 ? newPermissions : user.permissions), ...missingPermissions];
          result.changes.push(`Added ${missingPermissions.length} missing permissions`);
          needsUpdate = true;
        }
      }
    } else {
      // Role not found in ROLE_PERMISSIONS
      result.warnings = [`Role '${user.role}' not found in ROLE_PERMISSIONS`];

      // If permissions have colon notation, still convert them
      if (user.permissions && user.permissions.some(p => p.includes(':'))) {
        newPermissions = user.permissions.map(p => convertPermissionFormat(p));
        result.changes.push('Converted permissions to dot notation (role not in system)');
        needsUpdate = true;
      }
    }

    // Update user if needed
    if (needsUpdate) {
      user.permissions = [...new Set(newPermissions)]; // Remove duplicates
      await user.save();
      result.success = true;
    } else {
      result.success = true;
      result.changes.push('No changes needed');
    }

  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Main migration function
 */
async function migrateAllUsers() {
  try {
    log.section('🚀 Starting User Permissions Migration');
    log.info('Connecting to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');

    // Get all users
    log.info('Fetching all users...');
    const users = await User.find({});
    log.success(`Found ${users.length} users to migrate`);

    if (users.length === 0) {
      log.warning('No users found in database');
      return;
    }

    // Statistics
    const stats = {
      total: users.length,
      success: 0,
      failed: 0,
      noChanges: 0,
      roleBreakdown: {}
    };

    log.section('📝 Migrating Users:');

    // Migrate each user
    for (const user of users) {
      const result = await migrateUser(user);

      // Update statistics
      if (!stats.roleBreakdown[result.role]) {
        stats.roleBreakdown[result.role] = { count: 0, migrated: 0 };
      }
      stats.roleBreakdown[result.role].count++;

      if (result.success) {
        stats.success++;
        if (result.changes.length > 0 && result.changes[0] !== 'No changes needed') {
          stats.roleBreakdown[result.role].migrated++;
          log.success(`${result.email} (${result.role})`);
          result.changes.forEach(change => log.info(`  - ${change}`));
        } else {
          stats.noChanges++;
          log.info(`${result.email} (${result.role}) - No changes needed`);
        }
      } else {
        stats.failed++;
        log.error(`${result.email} (${result.role})`);
        result.errors.forEach(error => log.error(`  - ${error}`));
      }

      if (result.warnings) {
        result.warnings.forEach(warning => log.warning(`  - ${warning}`));
      }
    }

    // Display summary
    log.section('📊 Migration Summary:');
    console.log(`Total users: ${stats.total}`);
    console.log(`✓ Successfully migrated: ${stats.success}`);
    console.log(`✗ Failed: ${stats.failed}`);
    console.log(`ℹ No changes needed: ${stats.noChanges}`);

    log.section('📈 Breakdown by Role:');
    Object.entries(stats.roleBreakdown).forEach(([role, data]) => {
      console.log(`  ${role}: ${data.count} users (${data.migrated} migrated)`);
    });

    log.section('✅ Migration Complete!');

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateAllUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log.error(`Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateUser, migrateAllUsers };
