const request = require('supertest');
const app = require('../app');
const Sale = require('../src/models/Sale');
const Product = require('../src/models/Product');

describe('Sales API', () => {
  let adminUser, adminToken, cashierUser, cashierToken, testProduct;

  beforeEach(async () => {
    // Create test users
    adminUser = await testHelpers.createTestUser({
      role: 'admin',
      permissions: {
        sales: { read: true, create: true, update: true, delete: true },
        products: { read: true, update: true }
      }
    });
    adminToken = testHelpers.generateTestToken(adminUser._id, 'admin');

    cashierUser = await testHelpers.createTestUser({
      email: 'cashier@example.com',
      role: 'cashier',
      permissions: {
        sales: { read: true, create: true },
        products: { read: true }
      }
    });
    cashierToken = testHelpers.generateTestToken(cashierUser._id, 'cashier');

    // Create test product
    testProduct = await testHelpers.createTestProduct({
      stockQuantity: 100
    });
  });

  describe('POST /api/sales', () => {
    it('should create a new sale', async () => {
      const saleData = {
        items: [{
          productId: testProduct._id,
          quantity: 2,
          price: testProduct.price,
          discount: 0
        }],
        paymentMethod: 'cash',
        branchId: cashierUser.branchId
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.receiptNumber).toBeDefined();
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(testProduct.price * 2);

      // Verify stock was reduced
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(98);
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
        branchId: cashierUser.branchId
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(saleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subtotal).toBe(9.00);
      expect(response.body.data.tax).toBeGreaterThan(0);
      expect(response.body.data.total).toBeGreaterThan(9.00);
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
        branchId: cashierUser.branchId
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
      const staffUser = await testHelpers.createTestUser({
        email: 'staff@example.com',
        role: 'staff',
        permissions: {
          products: { read: true }
          // No sales permissions
        }
      });
      const staffToken = testHelpers.generateTestToken(staffUser._id, 'staff');

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
      await testHelpers.createTestSale({
        cashierId: cashierUser._id,
        branchId: cashierUser.branchId
      });
      await testHelpers.createTestSale({
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
      expect(response.body.data.totalPages).toBeDefined();
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
      expect(response.body.data.currentPage).toBe(1);
    });
  });

  describe('GET /api/sales/:id', () => {
    it('should get sale by ID', async () => {
      const sale = await testHelpers.createTestSale({
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
      const sale = await testHelpers.createTestSale({
        cashierId: cashierUser._id,
        items: [{
          productId: testProduct._id,
          quantity: 2,
          price: testProduct.price,
          discount: 0,
          total: testProduct.price * 2
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
      expect(updatedProduct.stockQuantity).toBe(testProduct.stockQuantity + 2);
    });

    it('should process partial refund', async () => {
      const sale = await testHelpers.createTestSale({
        cashierId: cashierUser._id,
        items: [{
          productId: testProduct._id,
          quantity: 3,
          price: testProduct.price,
          discount: 0,
          total: testProduct.price * 3
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
      expect(response.body.data.refundAmount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sales/receipt/:receiptNumber', () => {
    it('should get sale by receipt number', async () => {
      const sale = await testHelpers.createTestSale({
        receiptNumber: 'RCP-TEST-001',
        cashierId: cashierUser._id
      });

      const response = await request(app)
        .get('/api/sales/receipt/RCP-TEST-001')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.receiptNumber).toBe('RCP-TEST-001');
    });
  });
});