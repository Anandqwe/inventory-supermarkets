const request = require('supertest');
const app = require('../app');
const Product = require('../src/models/Product');

describe('Products API', () => {
  let adminUser, adminToken, staffUser, staffToken;
  let testCategory, testUnit, testBrand, testBranch;

  beforeEach(async () => {
    // Create test users
    adminUser = await global.testHelpers.createTestUser({
      email: `admin-${Date.now()}-${Math.random()}@example.com`,
      role: 'Admin',
      permissions: ['manage_products', 'view_products', 'create_products', 'update_products', 'delete_products']
    });
    adminToken = global.testHelpers.generateTestToken(adminUser._id, 'Admin');

    staffUser = await global.testHelpers.createTestUser({
      email: `staff-${Date.now()}-${Math.random()}@example.com`,
      role: 'Cashier',
      permissions: ['view_products']
    });
    staffToken = global.testHelpers.generateTestToken(staffUser._id, 'Cashier');

    // Create necessary dependencies for products
    testCategory = await global.testHelpers.createTestCategory({ createdBy: adminUser._id });
    testUnit = await global.testHelpers.createTestUnit({ createdBy: adminUser._id });
    testBrand = await global.testHelpers.createTestBrand({ createdBy: adminUser._id });
    testBranch = await global.testHelpers.createTestBranch({ createdBy: adminUser._id });
  });

  describe('GET /api/products', () => {
    it('should get all products for authorized user', async () => {
      // Create test products
      await global.testHelpers.createTestProduct({ 
        name: 'Product 1', 
        sku: 'SKU-001',
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });
      await global.testHelpers.createTestProduct({ 
        name: 'Product 2', 
        sku: 'SKU-002',
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination.totalPages).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBeDefined();
    });

    it('should support pagination', async () => {
      // Create multiple products
      for (let i = 1; i <= 15; i++) {
        await global.testHelpers.createTestProduct({ 
          name: `Product ${i}`, 
          sku: `SKU-${i.toString().padStart(3, '0')}`,
          category: testCategory._id,
          unit: testUnit._id,
          brand: testBrand._id,
          stockByBranch: [{
            branch: testBranch._id,
            quantity: 100,
            reorderLevel: 10,
            maxStockLevel: 1000
          }]
        });
      }

      const response = await request(app)
        .get('/api/products?page=2&limit=10')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(5);
      expect(response.body.data.pagination.currentPage).toBe(2);
    });

    it('should support search functionality', async () => {
      await global.testHelpers.createTestProduct({ name: 'Apple Juice', sku: 'APP-001' });
      await global.testHelpers.createTestProduct({ name: 'Orange Juice', sku: 'ORA-001' });

      const response = await request(app)
        .get('/api/products?search=apple')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toContain('Apple');
    });

    it('should not allow access without authentication', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin permissions', async () => {
      const productData = {
        name: 'New Product',
        sku: 'NEW-001',
        description: 'A new product',
        category: testCategory._id,
        brand: testBrand._id,
        unit: testUnit._id,
        pricing: {
          sellingPrice: 15.99,
          costPrice: 8.99,
          mrp: 17.99,
          taxRate: 18
        },
        branchStocks: [{
          branchId: testBranch._id,
          quantity: 50,
          reorderLevel: 5,
          maxStockLevel: 200
        }]
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.sku).toBe(productData.sku);
    });

    it('should not create product without permissions', async () => {
      const productData = {
        name: 'New Product',
        sku: 'NEW-001',
        price: 15.99
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not create product with duplicate SKU', async () => {
      await global.testHelpers.createTestProduct({ 
        sku: 'DUP-001',
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Product',
          sku: 'DUP-001',
          category: testCategory._id,
          unit: testUnit._id,
          pricing: {
            sellingPrice: 10.99,
            costPrice: 5.99
          },
          branchStocks: [{
            branchId: testBranch._id,
            quantity: 20
          }]
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('SKU');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by ID', async () => {
      const product = await global.testHelpers.createTestProduct({
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(product._id.toString());
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product with admin permissions', async () => {
      const product = await global.testHelpers.createTestProduct({
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const updateData = {
        name: 'Updated Product',
        pricing: {
          sellingPrice: 19.99,
          costPrice: 9.99
        }
      };

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.pricing.sellingPrice).toBe(updateData.pricing.sellingPrice);
    });

    it('should not update product without permissions', async () => {
      const product = await global.testHelpers.createTestProduct({
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Updated' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product with admin permissions', async () => {
      const product = await global.testHelpers.createTestProduct({
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product is deleted (soft delete)
      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct.isActive).toBe(false);
    });

    it('should not delete product without permissions', async () => {
      const product = await global.testHelpers.createTestProduct({
        category: testCategory._id,
        unit: testUnit._id,
        brand: testBrand._id,
        stockByBranch: [{
          branch: testBranch._id,
          quantity: 100,
          reorderLevel: 10,
          maxStockLevel: 1000
        }]
      });

      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/products/bulk', () => {
    it('should create multiple products', async () => {
      const productsData = [
        {
          name: 'Bulk Product 1',
          sku: 'BLK-001',
          category: testCategory._id,
          unit: testUnit._id,
          pricing: {
            sellingPrice: 10.99,
            costPrice: 8.99
          }
        },
        {
          name: 'Bulk Product 2',
          sku: 'BLK-002',
          category: testCategory._id,
          unit: testUnit._id,
          pricing: {
            sellingPrice: 15.99,
            costPrice: 12.99
          }
        }
      ];

      const response = await request(app)
        .post('/api/products/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ products: productsData })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(2);
      expect(response.body.data.failed).toBe(0);
    });

    it('should handle partial failures in bulk creation', async () => {
      // Create a product with existing SKU
      await global.testHelpers.createTestProduct({ sku: 'EXIST-001' });

      const productsData = [
        {
          name: 'Valid Product',
          sku: 'VALID-001',
          category: testCategory._id,
          unit: testUnit._id,
          pricing: {
            sellingPrice: 10.99,
            costPrice: 8.99
          }
        },
        {
          name: 'Invalid Product',
          sku: 'EXIST-001', // Duplicate SKU
          category: testCategory._id,
          unit: testUnit._id,
          pricing: {
            sellingPrice: 15.99,
            costPrice: 12.99
          }
        }
      ];

      const response = await request(app)
        .post('/api/products/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ products: productsData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.failed).toBe(1);
    });
  });
});
