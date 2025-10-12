const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

let mongoServer;

// Setup test database before all tests
beforeAll(async () => {
  // Use MongoDB Memory Server for testing
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Close any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to test database
  await mongoose.connect(uri);
}, 30000); // 30 second timeout

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}, 30000); // 30 second timeout

// Global test helpers
global.testHelpers = {
  // Create test user
  createTestUser: async (overrides = {}) => {
    const User = require('../src/models/User');

    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!', // Let the User model hash this
      role: 'Cashier',
      branch: new mongoose.Types.ObjectId(),
      permissions: ['view_products', 'create_sales'],
      isActive: true,
      ...overrides
    };

    return await User.create(userData);
  },

  // Create test category
  createTestCategory: async (overrides = {}) => {
    const Category = require('../src/models/Category');

    // Create a user if not provided
    let createdBy = overrides.createdBy;
    if (!createdBy) {
      const testUser = await global.testHelpers.createTestUser({ role: 'Admin' });
      createdBy = testUser._id;
    }

    const categoryData = {
      name: 'Test Category',
      code: `TC${Math.floor(Math.random() * 10000)}`.substring(0, 8), // Ensure max 8 chars within 2-10 limit
      description: 'A test category',
      isActive: true,
      createdBy,
      ...overrides
    };

    return await Category.create(categoryData);
  },

  // Create test unit
  createTestUnit: async (overrides = {}) => {
    const Unit = require('../src/models/Unit');

    // Create a user if not provided
    let createdBy = overrides.createdBy;
    if (!createdBy) {
      const testUser = await global.testHelpers.createTestUser({ role: 'Admin' });
      createdBy = testUser._id;
    }

    const unitData = {
      name: 'Test Unit',
      code: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,  // Generates ABC, XYZ, etc.
      description: 'A test unit',
      type: 'count',
      isActive: true,
      createdBy,
      ...overrides
    };

    return await Unit.create(unitData);
  },

  // Create test brand
  createTestBrand: async (overrides = {}) => {
    const Brand = require('../src/models/Brand');

    // Create a user if not provided
    let createdBy = overrides.createdBy;
    if (!createdBy) {
      const testUser = await global.testHelpers.createTestUser({ role: 'Admin' });
      createdBy = testUser._id;
    }

    const brandData = {
      name: 'Test Brand',
      code: `TB${Math.floor(Math.random() * 10000)}`.substring(0, 8), // Ensure max 8 chars within 2-10 limit
      description: 'A test brand',
      isActive: true,
      createdBy,
      ...overrides
    };

    return await Brand.create(brandData);
  },

  // Create test branch
  createTestBranch: async (overrides = {}) => {
    const Branch = require('../src/models/Branch');

    // Create a user if not provided
    let createdBy = overrides.createdBy;
    if (!createdBy) {
      const testUser = await global.testHelpers.createTestUser({ role: 'Admin' });
      createdBy = testUser._id;
    }

    const branchData = {
      name: 'Test Branch',
      code: `BR${Math.floor(Math.random() * 10000)}`.substring(0, 8), // Ensure max 8 chars within 2-10 limit
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        country: 'India'
      },
      contact: {
        phone: '9876543210',
        email: `testbranch${Math.floor(Math.random() * 1000)}@example.com`
      },
      isActive: true,
      createdBy,
      ...overrides
    };

    return await Branch.create(branchData);
  },

  // Create test product
  createTestProduct: async (overrides = {}) => {
    const Product = require('../src/models/Product');

    // Create necessary dependencies if not provided
    let category, unit, brand, branch, adminUser;

    // Create a single admin user for all dependencies if needed
    if (!overrides.category || !overrides.unit || !overrides.brand || !overrides.stockByBranch) {
      adminUser = await global.testHelpers.createTestUser({
        role: 'Admin',
        email: `product-admin-${Date.now()}@example.com`
      });
    }

    if (!overrides.category) {
      category = await global.testHelpers.createTestCategory({ createdBy: adminUser._id });
    }

    if (!overrides.unit) {
      unit = await global.testHelpers.createTestUnit({ createdBy: adminUser._id });
    }

    if (!overrides.brand) {
      brand = await global.testHelpers.createTestBrand({ createdBy: adminUser._id });
    }

    if (!overrides.stockByBranch) {
      branch = await global.testHelpers.createTestBranch({ createdBy: adminUser._id });
    }

    const productData = {
      name: 'Test Product',
      sku: `TEST-${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
      description: 'A test product',
      category: category?._id || overrides.category,
      brand: brand?._id || overrides.brand,
      unit: unit?._id || overrides.unit,
      pricing: {
        costPrice: 5.99,
        sellingPrice: 10.99,
        mrp: 12.99,
        taxRate: 18
      },
      stockByBranch: overrides.stockByBranch || [{
        branch: branch._id,
        quantity: 100,
        reorderLevel: 10,
        maxStockLevel: 1000
      }],
      createdBy: overrides.createdBy || adminUser?._id || new mongoose.Types.ObjectId(),
      isActive: true,
      ...overrides
    };

    return await Product.create(productData);
  },

  // Create test sale
  createTestSale: async (overrides = {}) => {
    const Sale = require('../src/models/Sale');

    const saleData = {
      saleNumber: `SALE-${Date.now()}`,
      branch: new mongoose.Types.ObjectId(),
      items: [{
        product: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        sku: 'TEST-001',
        quantity: 2,
        costPrice: 5.99,
        sellingPrice: 10.99,
        unitPrice: 10.99,
        total: 21.98,
        discount: 0,
        tax: 0
      }],
      subtotal: 21.98,
      taxAmount: 2.20,
      discountAmount: 0,
      total: 24.18,
      paymentMethod: 'cash',
      amountPaid: 24.18,
      amountDue: 0,
      createdBy: new mongoose.Types.ObjectId(),
      status: 'completed',
      ...overrides
    };

    return await Sale.create(saleData);
  },

  // Generate JWT token for testing
  generateTestToken: (userId, role = 'Cashier') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        id: userId,
        email: 'test@example.com',
        role,
        fullName: 'Test User'
      },
      process.env.JWT_SECRET || 'test-secret-key',
      {
        expiresIn: '1h',
        issuer: 'inventory-supermarkets',
        audience: 'supermarket-users'
      }
    );
  }
};

// Suppress console.log during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
