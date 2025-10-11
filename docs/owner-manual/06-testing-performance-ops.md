# Part 6: Testing + Performance + Operations

## Testing Strategy

### Current Test Setup

**Test Framework** (`backend/tests/`):
- **Jest** with Supertest for API integration tests
- **MongoDB Memory Server** for isolated database testing
- **Test Coverage**: Target >80% for controllers and services

**Running Tests**:
```bash
# Backend testing
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
npm run test:ci            # CI/CD optimized run

# Frontend testing (not implemented)
# Frontend testing was not implemented for this project
# Focus is on comprehensive backend testing and functional UI
```

### Unit Tests for Core Business Logic

**Stock Math Tests** (`backend/tests/utils/stockCalculator.test.js`):
```javascript
const StockCalculator = require('../../src/utils/stockCalculator');

describe('Stock Calculation Logic', () => {
  test('should calculate available stock correctly', () => {
    const stock = {
      quantity: 100,
      reservedQuantity: 15
    };
    
    const available = StockCalculator.getAvailableStock(stock);
    expect(available).toBe(85);
  });
  
  test('should detect low stock condition', () => {
    const stock = { quantity: 5, reorderLevel: 10 };
    expect(StockCalculator.isLowStock(stock)).toBe(true);
    
    const stock2 = { quantity: 15, reorderLevel: 10 };
    expect(StockCalculator.isLowStock(stock2)).toBe(false);
  });
  
  test('should prevent negative stock', () => {
    const stock = { quantity: 5, reservedQuantity: 0 };
    const saleQuantity = 10;
    
    expect(() => {
      StockCalculator.validateSaleQuantity(stock, saleQuantity);
    }).toThrow('Insufficient stock available');
  });
});
```

**GST Math Tests** (`backend/tests/utils/gstCalculator.test.js`):
```javascript
const GSTCalculator = require('../../src/utils/gstUtils');

describe('GST Calculation Logic', () => {
  test('should calculate intrastate GST correctly', () => {
    const result = GSTCalculator.calculateTax(100, 18, false, 'KA', 'KA');
    
    expect(result.cgst).toBe(9);    // 50% of 18%
    expect(result.sgst).toBe(9);    // 50% of 18%
    expect(result.igst).toBe(0);
    expect(result.totalTax).toBe(18);
  });
  
  test('should calculate interstate GST correctly', () => {
    const result = GSTCalculator.calculateTax(100, 18, false, 'KA', 'TN');
    
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(18);   // Full 18% as IGST
    expect(result.totalTax).toBe(18);
  });
  
  test('should handle invoice total calculation', () => {
    const items = [
      { quantity: 2, unitPrice: 50, gstRate: 5 },   // ₹100 + ₹5 tax
      { quantity: 1, unitPrice: 100, gstRate: 18 }  // ₹100 + ₹18 tax
    ];
    
    const invoice = GSTCalculator.calculateInvoiceTotal(items);
    
    expect(invoice.subtotal).toBe(200);
    expect(invoice.totalTax).toBe(23);
    expect(invoice.grandTotal).toBe(223);
  });
});
```

### Integration Tests

**Authentication Flow Tests** (`backend/tests/auth.test.js`):
```javascript
const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB } = require('./setup');

describe('Authentication API', () => {
  beforeAll(async () => await setupTestDB());
  afterAll(async () => await teardownTestDB());
  
  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@supermarket.com',
          password: 'Admin@123456'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('admin@supermarket.com');
    });
    
    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@supermarket.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });
});
```

**Product CRUD Tests** (`backend/tests/products.test.js`):
```javascript
describe('Product Management API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@supermarket.com', password: 'Admin@123456' });
    authToken = loginResponse.body.data.token;
  });
  
  test('should create new product', async () => {
    const productData = {
      name: 'Test Product',
      sku: 'TST-TEST-0001',
      costPrice: 45.00,
      sellingPrice: 50.00,
      category: categoryId,
      brand: brandId
    };
    
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData);
    
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Test Product');
    expect(response.body.data.sku).toBe('TST-TEST-0001');
  });
  
  test('should prevent duplicate SKU creation', async () => {
    // Try to create product with same SKU
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...productData, name: 'Different Name' });
    
    expect(response.status).toBe(409);
    expect(response.body.message).toContain('SKU already exists');
  });
});
```

**Sales Transaction Tests** (`backend/tests/sales.test.js`):
```javascript
describe('Sales Transaction API', () => {
  test('should process sale with stock deduction', async () => {
    // Check initial stock
    const product = await Product.findOne({ sku: 'TST-TEST-0001' });
    const initialStock = product.stocks[0].quantity;
    
    const saleData = {
      items: [{
        product: product._id,
        quantity: 2,
        unitPrice: 50.00
      }],
      paymentMethod: 'cash'
    };
    
    const response = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send(saleData);
    
    expect(response.status).toBe(201);
    expect(response.body.data.total).toBe(100.00);
    
    // Verify stock was deducted
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stocks[0].quantity).toBe(initialStock - 2);
  });
  
  test('should reject sale with insufficient stock', async () => {
    const saleData = {
      items: [{
        product: productId,
        quantity: 1000, // More than available stock
        unitPrice: 50.00
      }],
      paymentMethod: 'cash'
    };
    
    const response = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${authToken}`)
      .send(saleData);
    
    expect(response.status).toBe(422);
    expect(response.body.message).toContain('Insufficient stock');
  });
});
```

### Write Your First Test Tutorial

**Step 1: Create Test File**
```bash
# Create new test file
touch backend/tests/myFeature.test.js
```

**Step 2: Basic Test Structure**
```javascript
// backend/tests/myFeature.test.js
const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB } = require('./setup');

describe('My Feature Tests', () => {
  beforeAll(async () => {
    await setupTestDB(); // Clean database for testing
  });
  
  afterAll(async () => {
    await teardownTestDB(); // Cleanup after tests
  });
  
  test('should do something specific', async () => {
    // Arrange: Set up test data
    const testData = { name: 'Test Item' };
    
    // Act: Perform the action
    const response = await request(app)
      .post('/api/my-endpoint')
      .send(testData);
    
    // Assert: Check the results
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Item');
  });
});
```

**Step 3: Run Your Test**
```bash
npm test -- --testNamePattern="My Feature"
```

---

## Performance & Scaling

### MongoDB Indexes Strategy

**Critical Indexes** (to be created in `backend/scripts/createIndexes.js`):
```javascript
// Product indexes for fast searches
db.products.createIndex({ "sku": 1 }, { unique: true });
db.products.createIndex({ "barcode": 1 }, { unique: true, sparse: true });
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1, "isActive": 1 });
db.products.createIndex({ "stocks.branch": 1, "stocks.quantity": 1 });

// Sales indexes for reporting queries
db.sales.createIndex({ "createdAt": -1 }); // Latest sales first
db.sales.createIndex({ "branch": 1, "createdAt": -1 });
db.sales.createIndex({ "cashier": 1, "createdAt": -1 });
db.sales.createIndex({ "saleNumber": 1 }, { unique: true });

// User indexes for authentication
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1, "isActive": 1 });

// Audit logs for compliance queries
db.auditlogs.createIndex({ "createdAt": -1 });
db.auditlogs.createIndex({ "userId": 1, "action": 1 });
db.auditlogs.createIndex({ "entity": 1, "entityId": 1 });
```

**Run Index Creation**:
```bash
npm run db:indexes
```

### Server-Side Pagination Pattern

**Consistent Pagination** (`backend/src/utils/paginationUtils.js`):
```javascript
class PaginationUtils {
  static paginate(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }
  
  static async paginateWithCount(Model, filter, page = 1, limit = 20, sort = {}) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Model.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      Model.countDocuments(filter)
    ]);
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

// Usage in controllers
const getProducts = async (req, res) => {
  const { page = 1, limit = 20, search, category } = req.query;
  
  const filter = {};
  if (search) {
    filter.$text = { $search: search };
  }
  if (category) {
    filter.category = category;
  }
  
  const result = await PaginationUtils.paginateWithCount(
    Product, 
    filter, 
    page, 
    limit, 
    { createdAt: -1 }
  );
  
  ResponseUtils.success(res, result.data, 'Products retrieved', 200, result.pagination);
};
```

### Query Optimization Patterns

**Use .lean() for Read-Only Queries**:
```javascript
// ❌ Slow: Returns full Mongoose documents
const products = await Product.find({ category: categoryId });

// ✅ Fast: Returns plain JavaScript objects
const products = await Product.find({ category: categoryId }).lean();
```

**Use Projections to Limit Fields**:
```javascript
// ❌ Slow: Returns all fields
const products = await Product.find();

// ✅ Fast: Returns only needed fields
const products = await Product.find({}, 'name sku price stocks.quantity');
```

**Use $match Early in Aggregations**:
```javascript
// ❌ Slow: Filters after processing all documents
const salesReport = await Sale.aggregate([
  { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' }},
  { $match: { createdAt: { $gte: startDate, $lte: endDate } }}
]);

// ✅ Fast: Filters before expensive operations
const salesReport = await Sale.aggregate([
  { $match: { createdAt: { $gte: startDate, $lte: endDate } }}, // Filter first
  { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' }}
]);
```

### Transaction Management

**MongoDB Transactions for Multi-Document Operations**:
```javascript
// backend/src/controllers/salesController.js
const processSale = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      // 1. Validate stock availability
      for (const item of saleItems) {
        const product = await Product.findById(item.product).session(session);
        const availableStock = product.stocks[0].quantity;
        
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }
      
      // 2. Deduct stock from products
      for (const item of saleItems) {
        await Product.updateOne(
          { _id: item.product, 'stocks.branch': branchId },
          { $inc: { 'stocks.$.quantity': -item.quantity } }
        ).session(session);
      }
      
      // 3. Create sale record
      const sale = await Sale.create([saleData], { session });
      
      return sale[0];
    });
    
    ResponseUtils.success(res, result, 'Sale completed successfully', 201);
  } catch (error) {
    ResponseUtils.error(res, error.message, 422);
  } finally {
    await session.endSession();
  }
};
```

---

## Observability & Operations

### Logging Strategy

**Winston Logger Configuration** (`backend/src/utils/logger.js`):
```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'inventory-api' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // All logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 10
    }),
    
    // Console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || Math.random().toString(36);
  req.requestId = requestId;
  
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  next();
};

module.exports = { logger, requestLogger };
```

**What to Search When Things Fail**:
```bash
# Search logs for specific patterns
grep "ERROR" backend/logs/error.log
grep "401" backend/logs/combined.log    # Authentication failures
grep "500" backend/logs/combined.log    # Server errors
grep "userId.*12345" backend/logs/*.log # Specific user activity

# Search by request ID for full trace
grep "req-abc123" backend/logs/combined.log
```

### Health & Ready Endpoints

**Health Check Implementation** (`backend/src/routes/healthRoutes.js`):
```javascript
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Detailed readiness check
router.get('/ready', async (req, res) => {
  const checks = {};
  let isReady = true;
  
  // Database connectivity
  try {
    await mongoose.connection.db.admin().ping();
    checks.database = { status: 'healthy', responseTime: '< 100ms' };
  } catch (error) {
    checks.database = { status: 'unhealthy', error: error.message };
    isReady = false;
  }
  
  // External services (if any)
  checks.email = { status: 'healthy' }; // Add actual SMTP check
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not-ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
```

### Backup & Restore Basics

**MongoDB Backup Commands** (development notes):
```bash
# Create backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/inventory_db" --out=./backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/inventory_db" ./backup/20241002/inventory_db

# Selective collection backup
mongodump --uri="mongodb+srv://..." --collection=products --out=./products-backup

# Automated daily backup (cron job)
0 2 * * * /usr/bin/mongodump --uri="$MONGODB_URI" --out=/backups/daily/$(date +\%Y\%m\%d)
```

### Performance Monitoring

**Simple Metrics Collection** (`backend/src/middleware/performanceMonitor.js`):
```javascript
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, url } = req;
    const { statusCode } = res;
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method,
        url,
        statusCode,
        duration,
        userId: req.user?.id
      });
    }
    
    // Collect metrics (can be sent to monitoring service)
    metrics.recordRequest(method, url, statusCode, duration);
  });
  
  next();
};

class MetricsCollector {
  constructor() {
    this.requests = new Map();
  }
  
  recordRequest(method, url, statusCode, duration) {
    const key = `${method} ${url}`;
    const existing = this.requests.get(key) || { count: 0, totalDuration: 0 };
    
    this.requests.set(key, {
      count: existing.count + 1,
      totalDuration: existing.totalDuration + duration,
      avgDuration: (existing.totalDuration + duration) / (existing.count + 1),
      lastStatusCode: statusCode
    });
  }
  
  getMetrics() {
    return Object.fromEntries(this.requests);
  }
}
```

---

## Navigation

**← Previous**: [GST & Pricing + Seeding](05-gst-seeding.md)  
**→ Next**: [How-to Recipes + Demo + FAQ](07-recipes-demo-faq.md)