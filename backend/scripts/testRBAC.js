#!/usr/bin/env node

/**
 * RBAC Quick Test Script
 * Automated API testing for role permissions
 *
 * Usage: node scripts/testRBAC.js
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';

// Test accounts
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@mumbaisupermart.com',
    password: 'Mumbai@123456',
    role: 'Admin',
    expectedPermissions: 56 // Should have all permissions
  },
  regionalManager: {
    email: 'regional.manager@mumbaisupermart.com',
    password: 'Mumbai@123456',
    role: 'Regional Manager',
    expectedPermissions: 42
  },
  storeManager: {
    email: 'manager.andheri@mumbaisupermart.com',
    password: 'Mumbai@123456',
    role: 'Store Manager',
    expectedPermissions: 35
  },
  inventoryManager: {
    email: 'inventory.andheri@mumbaisupermart.com',
    password: 'Mumbai@123456',
    role: 'Inventory Manager',
    expectedPermissions: 28
  },
  cashier: {
    email: 'cashier1.andheri@mumbaisupermart.com',
    password: 'Mumbai@123456',
    role: 'Cashier',
    expectedPermissions: 12
  },
  viewer: {
    email: 'viewer@mumbaisupermart.com',
    password: 'Mumbai@123456',
    role: 'Viewer',
    expectedPermissions: 20
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper functions
const log = {
  success: (msg) => console.log('\x1b[32m✅ ' + msg + '\x1b[0m'),
  error: (msg) => console.log('\x1b[31m❌ ' + msg + '\x1b[0m'),
  info: (msg) => console.log('\x1b[34mℹ️  ' + msg + '\x1b[0m'),
  warning: (msg) => console.log('\x1b[33m⚠️  ' + msg + '\x1b[0m'),
  section: (msg) => console.log('\x1b[36m\x1b[1m\n' + '='.repeat(60) + '\n' + msg + '\n' + '='.repeat(60) + '\x1b[0m')
};

/**
 * Make HTTP request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Login and get token
 */
async function login(email, password) {
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, { email, password });

    if (response.data.success && response.data.data && response.data.data.token) {
      return {
        token: response.data.data.token,
        user: response.data.data.user
      };
    }
    return null;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

/**
 * Test if action is allowed (should return 200/201)
 */
async function testAllowed(description, method, path, token, data = null) {
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, data);

    if (response.status >= 200 && response.status < 300) {
      log.success(`${description} - Allowed (${response.status})`);
      results.passed++;
      return true;
    }

    log.error(`${description} - Unexpected status ${response.status}`);
    results.failed++;
    results.errors.push(`${description}: Expected 2xx, got ${response.status}`);
    return false;

  } catch (error) {
    log.warning(`${description} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Test if action is forbidden (should return 403)
 */
async function testForbidden(description, method, path, token, data = null) {
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, data);

    if (response.status === 403) {
      log.success(`${description} - Correctly forbidden (403)`);
      results.passed++;
      return true;
    }

    if (response.status === 401) {
      log.warning(`${description} - Authentication issue (401)`);
      return false;
    }

    log.error(`${description} - Should be forbidden but got ${response.status}`);
    results.failed++;
    results.errors.push(`${description}: Expected 403, got ${response.status}`);
    return false;

  } catch (error) {
    log.error(`${description} - Unexpected error: ${error.message}`);
    results.failed++;
    results.errors.push(`${description}: Expected 403, got error`);
    return false;
  }
}

/**
 * Test Admin role
 */
async function testAdmin() {
  log.section('🔑 Testing ADMIN Role');

  const auth = await login(TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
  if (!auth) {
    log.error('Admin login failed');
    return;
  }

  log.info(`Logged in as: ${auth.user.firstName} ${auth.user.lastName} (${auth.user.role})`);
  log.info(`Permissions: ${auth.user.permissions.length} / ${TEST_ACCOUNTS.admin.expectedPermissions}`);

  // Test various endpoints
  await testAllowed('View products', 'GET', '/products?page=1&limit=10', auth.token);
  await testAllowed('View users', 'GET', '/auth/users?page=1&limit=10', auth.token);
  await testAllowed('View sales', 'GET', '/sales?page=1&limit=10', auth.token);
  await testAllowed('View dashboard', 'GET', '/dashboard/overview', auth.token);
  await testAllowed('View reports', 'GET', '/reports/sales?startDate=2024-01-01&endDate=2024-12-31', auth.token);

  log.info(`\nAdmin Tests: ${results.passed} passed, ${results.failed} failed`);
}

/**
 * Test Cashier role
 */
async function testCashier() {
  log.section('💰 Testing CASHIER Role');

  const auth = await login(TEST_ACCOUNTS.cashier.email, TEST_ACCOUNTS.cashier.password);
  if (!auth) {
    log.error('Cashier login failed');
    return;
  }

  log.info(`Logged in as: ${auth.user.firstName} ${auth.user.lastName} (${auth.user.role})`);
  log.info(`Permissions: ${auth.user.permissions.length} / ${TEST_ACCOUNTS.cashier.expectedPermissions}`);

  const beforeFailed = results.failed;

  // Should be allowed
  await testAllowed('View products (read-only)', 'GET', '/products?page=1&limit=10', auth.token);

  // Should be forbidden
  await testForbidden('Create product', 'POST', '/products', auth.token, {
    name: 'Test Product',
    sku: 'TEST-001',
    barcode: '1234567890'
  });
  await testForbidden('Delete product', 'DELETE', '/products/507f1f77bcf86cd799439011', auth.token);
  await testForbidden('View users', 'GET', '/auth/users', auth.token);
  await testForbidden('View financial reports', 'GET', '/financial/invoices', auth.token);

  const cashierPassed = results.passed - (beforeFailed === results.failed ? results.passed : 0);
  log.info(`\nCashier Tests: ${cashierPassed} passed`);
}

/**
 * Test Store Manager role
 */
async function testStoreManager() {
  log.section('🏪 Testing STORE MANAGER Role');

  const auth = await login(TEST_ACCOUNTS.storeManager.email, TEST_ACCOUNTS.storeManager.password);
  if (!auth) {
    log.error('Store Manager login failed');
    return;
  }

  log.info(`Logged in as: ${auth.user.firstName} ${auth.user.lastName} (${auth.user.role})`);
  log.info(`Branch: ${auth.user.branch ? 'Assigned' : 'None'}`);
  log.info(`Permissions: ${auth.user.permissions.length} / ${TEST_ACCOUNTS.storeManager.expectedPermissions}`);

  const beforeFailed = results.failed;

  // Should be allowed
  await testAllowed('View products', 'GET', '/products?page=1&limit=10', auth.token);
  await testAllowed('View sales', 'GET', '/sales?page=1&limit=10', auth.token);
  await testAllowed('View inventory', 'GET', '/inventory/adjustments', auth.token);

  // Should be forbidden
  await testForbidden('Delete product', 'DELETE', '/products/507f1f77bcf86cd799439011', auth.token);
  await testForbidden('Delete sale', 'DELETE', '/sales/507f1f77bcf86cd799439011', auth.token);

  const managerPassed = results.passed - (beforeFailed === results.failed ? results.passed : 0);
  log.info(`\nStore Manager Tests: ${managerPassed} passed`);
}

/**
 * Test Viewer role
 */
async function testViewer() {
  log.section('👁️  Testing VIEWER Role');

  const auth = await login(TEST_ACCOUNTS.viewer.email, TEST_ACCOUNTS.viewer.password);
  if (!auth) {
    log.error('Viewer login failed');
    return;
  }

  log.info(`Logged in as: ${auth.user.firstName} ${auth.user.lastName} (${auth.user.role})`);
  log.info(`Permissions: ${auth.user.permissions.length} / ${TEST_ACCOUNTS.viewer.expectedPermissions}`);

  const beforeFailed = results.failed;

  // Should be allowed (read-only)
  await testAllowed('View products', 'GET', '/products?page=1&limit=10', auth.token);
  await testAllowed('View sales', 'GET', '/sales?page=1&limit=10', auth.token);
  await testAllowed('View reports', 'GET', '/reports/sales?startDate=2024-01-01&endDate=2024-12-31', auth.token);

  // Should be forbidden (all write operations)
  await testForbidden('Create product', 'POST', '/products', auth.token, {
    name: 'Test Product',
    sku: 'TEST-002'
  });
  await testForbidden('Update product', 'PUT', '/products/507f1f77bcf86cd799439011', auth.token, {
    name: 'Updated'
  });
  await testForbidden('Delete product', 'DELETE', '/products/507f1f77bcf86cd799439011', auth.token);
  await testForbidden('Create sale', 'POST', '/sales', auth.token, { items: [] });
  await testForbidden('View users', 'GET', '/auth/users', auth.token);

  const viewerPassed = results.passed - (beforeFailed === results.failed ? results.passed : 0);
  log.info(`\nViewer Tests: ${viewerPassed} passed`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\x1b[1m\x1b[36m\n╔════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[36m║         RBAC AUTOMATED PERMISSION TESTING                 ║\x1b[0m');
  console.log('\x1b[1m\x1b[36m╚════════════════════════════════════════════════════════════╝\n\x1b[0m');

  log.info('Testing API: http://localhost:5000/api');
  log.info('Starting tests...\n');

  try {
    // Run tests for each role
    await testAdmin();
    await testCashier();
    await testStoreManager();
    await testViewer();

    // Print summary
    log.section('📊 TEST SUMMARY');
    console.log(`\x1b[1mTotal Tests: ${results.passed + results.failed}\x1b[0m`);
    console.log(`\x1b[32m\x1b[1m✅ Passed: ${results.passed}\x1b[0m`);
    console.log(`\x1b[31m\x1b[1m❌ Failed: ${results.failed}\x1b[0m`);

    if (results.failed > 0) {
      console.log('\x1b[31m\x1b[1m\n❌ ERRORS FOUND:\n\x1b[0m');
      results.errors.forEach((error, i) => {
        console.log(`\x1b[31m${i + 1}. ${error}\x1b[0m`);
      });
    } else {
      console.log('\x1b[32m\x1b[1m\n🎉 ALL TESTS PASSED!\n\x1b[0m');
    }

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Check if backend is running
const healthCheck = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

makeRequest(healthCheck)
  .then(() => {
    log.success('Backend server is running');
    runTests();
  })
  .catch((error) => {
    log.error('Backend server is not running!');
    log.error('Please start the backend server: cd backend && npm run dev');
    process.exit(1);
  });
