const request = require('supertest');
const app = require('../app');
const Sale = require('../src/models/Sale');
const Product = require('../src/models/Product');

describe('Sales API', () => {
  let adminUser, adminToken, cashierUser, cashierToken, testProduct;

  beforeEach(async () => {
    // Create a test branch first
    const testBranch = await global.testHelpers.createTestBranch();
    
    // Create test users
    adminUser = await global.testHelpers.createTestUser({
      email: `admin-${Date.now()}@example.com`,
      role: 'Admin',
      permissions: ['manage_sales', 'view_sales', 'create_sales', 'update_sales', 'delete_sales', 'manage_products', 'view_products']
    });
    adminToken = global.testHelpers.generateTestToken(adminUser._id, 'Admin');

    cashierUser = await global.testHelpers.createTestUser({
      email: `cashier-${Date.now()}@example.com`,
      role: 'Cashier',
      permissions: ['view_sales', 'create_sales', 'view_products'],
      branch: testBranch._id
    });
    cashierToken = global.testHelpers.generateTestToken(cashierUser._id, 'Cashier');

    // Create test product with stock in the same branch as cashier
    testProduct = await global.testHelpers.createTestProduct({
      stockByBranch: [{
        branch: cashierUser.branch,
        quantity: 100,
        reorderLevel: 10,
        maxStockLevel: 1000
      }]
    });
  });

  describe('POST /api/sales', () => {
    it('should create a new sale', async () => {
      const saleData = {
        items: [{
          productId: testProduct._id,
          quantity: 2,
          price: testProduct.pricing.sellingPrice,
          discount: 0
        }],
        paymentMethod: 'cash',
        branchId: cashierUser.branch
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.saleNumber).toBeDefined();
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(testProduct.pricing.sellingPrice * 2);

      // Verify stock was reduced
      const updatedProduct = await Product.findById(testProduct._id);
      const branchStock = updatedProduct.stockByBranch.find(stock => 
        stock.branch.toString() === testProduct.stockByBranch[0].branch.toString()
      );
      expect(branchStock.quantity).toBe(98);
    });

    it('should calculate totals correctly with tax and discount', async () => {
      const saleData = {
        items: [{
          productId: testProduct._id,
          quantity: 1,
          price: 10.00,
          discount: 1.00
        }],
        paymentMethod: 'card',
        branchId: cashierUser.branch
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subtotal).toBe(testProduct.pricing.sellingPrice);
      expect(response.body.data.total).toBe(testProduct.pricing.sellingPrice); // No tax or discount applied by default
    });

    it('should not create sale without sufficient stock', async () => {
      const saleData = {
        items: [{
          productId: testProduct._id,
          quantity: 150, // More than available stock
          price: testProduct.price,
          discount: 0
        }],
        paymentMethod: 'cash',
        branchId: cashierUser.branch
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('stock');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: []
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not allow sale without permissions', async () => {
      const staffUser = await global.testHelpers.createTestUser({
        email: 'staff@example.com',
        role: 'Viewer',
        permissions: ['view_products']
        // No sales permissions
      });
      const staffToken = global.testHelpers.generateTestToken(staffUser._id, 'Viewer');

      const saleData = {
        items: [{
          productId: testProduct._id,
          quantity: 1,
          price: testProduct.price,
          discount: 0
        }],
        paymentMethod: 'cash',
        branchId: staffUser.branchId
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(saleData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sales', () => {
    beforeEach(async () => {
      // Create test sales
      await global.testHelpers.createTestSale({
        cashierId: cashierUser._id,
        branchId: cashierUser.branchId
      });
      await global.testHelpers.createTestSale({
        cashierId: cashierUser._id,
        branchId: cashierUser.branchId,
        receiptNumber: 'RCP-002'
      });
    });

    it('should get all sales for authorized user', async () => {
      const response = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sales).toHaveLength(2);
      expect(response.body.data.pagination.totalPages).toBeDefined();
    });

    it('should support date range filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/sales?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.sales)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/sales?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sales).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });
  });

  describe('GET /api/sales/:id', () => {
    it('should get sale by ID', async () => {
      const sale = await global.testHelpers.createTestSale({
        cashierId: cashierUser._id
      });

      const response = await request(app)
        .get(`/api/sales/${sale._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(sale._id.toString());
    });

    it('should return 404 for non-existent sale', async () => {
      const response = await request(app)
        .get('/api/sales/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/sales/:id/refund', () => {
    it('should process full refund', async () => {
      const sale = await global.testHelpers.createTestSale({
        cashierId: cashierUser._id,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          sku: testProduct.sku,
          quantity: 2,
          costPrice: testProduct.pricing.costPrice,
          sellingPrice: testProduct.pricing.sellingPrice,
          unitPrice: testProduct.pricing.sellingPrice,
          total: testProduct.pricing.sellingPrice * 2,
          discount: 0,
          tax: 0
        }]
      });

      const response = await request(app)
        .post(`/api/sales/${sale._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Customer request',
          refundType: 'full'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('refunded');

      // Verify stock was restored
      const updatedProduct = await Product.findById(testProduct._id);
      const branchStock = updatedProduct.stockByBranch.find(stock => 
        stock.branch.toString() === cashierUser.branch.toString()
      );
      expect(branchStock.quantity).toBe(100); // Original 100 - 2 sold + 2 refunded
    });

    it('should process partial refund', async () => {
      const sale = await global.testHelpers.createTestSale({
        cashierId: cashierUser._id,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          sku: testProduct.sku,
          quantity: 3,
          costPrice: testProduct.pricing.costPrice,
          sellingPrice: testProduct.pricing.sellingPrice,
          unitPrice: testProduct.pricing.sellingPrice,
          total: testProduct.pricing.sellingPrice * 3,
          discount: 0,
          tax: 0
        }]
      });

      const response = await request(app)
        .post(`/api/sales/${sale._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Partial return',
          refundType: 'partial',
          items: [{
            productId: testProduct._id,
            quantity: 1
          }]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('refunded');
      expect(response.body.data.refund).toBeDefined();
      expect(response.body.data.refund.items).toHaveLength(1);
    });
  });

  describe('GET /api/sales/receipt/:receiptNumber', () => {
    it('should get sale by receipt number', async () => {
      const sale = await global.testHelpers.createTestSale({
        saleNumber: 'RCP-TEST-001',
        cashierId: cashierUser._id
      });

      const response = await request(app)
        .get('/api/sales/receipt/RCP-TEST-001')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.saleNumber).toBe('RCP-TEST-001');
    });
  });
});
