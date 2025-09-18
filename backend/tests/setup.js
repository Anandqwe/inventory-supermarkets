const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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
});

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
});

// Global test helpers
global.testHelpers = {
  // Create test user
  createTestUser: async (overrides = {}) => {
    const User = require('../src/models/User');
    const bcrypt = require('bcryptjs');
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'staff',
      branchId: new mongoose.Types.ObjectId(),
      permissions: {
        products: { read: true },
        sales: { read: true, create: true }
      },
      ...overrides
    };
    
    return await User.create(userData);
  },
  
  // Create test product
  createTestProduct: async (overrides = {}) => {
    const Product = require('../src/models/Product');
    
    const productData = {
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'A test product',
      price: 10.99,
      costPrice: 5.99,
      categoryId: new mongoose.Types.ObjectId(),
      brandId: new mongoose.Types.ObjectId(),
      unitId: new mongoose.Types.ObjectId(),
      stockQuantity: 100,
      minStockLevel: 10,
      isActive: true,
      ...overrides
    };
    
    return await Product.create(productData);
  },
  
  // Create test sale
  createTestSale: async (overrides = {}) => {
    const Sale = require('../src/models/Sale');
    
    const saleData = {
      receiptNumber: 'RCP-001',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        quantity: 2,
        price: 10.99,
        discount: 0,
        total: 21.98
      }],
      subtotal: 21.98,
      tax: 2.20,
      discount: 0,
      total: 24.18,
      paymentMethod: 'cash',
      branchId: new mongoose.Types.ObjectId(),
      cashierId: new mongoose.Types.ObjectId(),
      ...overrides
    };
    
    return await Sale.create(saleData);
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId, role = 'staff') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        userId, 
        role,
        permissions: {
          products: { read: true },
          sales: { read: true, create: true }
        }
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
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