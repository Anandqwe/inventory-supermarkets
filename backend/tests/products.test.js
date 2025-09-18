const request = require('supertest');
const app = require('../app');
const Product = require('../src/models/Product');

describe('Products API', () => {
  let adminUser, adminToken, staffUser, staffToken;

  beforeEach(async () => {
    // Create test users
    adminUser = await testHelpers.createTestUser({
      role: 'admin',
      permissions: {
        products: { read: true, create: true, update: true, delete: true }
      }
    });
    adminToken = testHelpers.generateTestToken(adminUser._id, 'admin');

    staffUser = await testHelpers.createTestUser({
      email: 'staff@example.com',
      role: 'staff',
      permissions: {
        products: { read: true }
      }
    });
    staffToken = testHelpers.generateTestToken(staffUser._id, 'staff');
  });

  describe('GET /api/products', () => {
    it('should get all products for authorized user', async () => {
      // Create test products
      await testHelpers.createTestProduct({ name: 'Product 1', sku: 'SKU-001' });
      await testHelpers.createTestProduct({ name: 'Product 2', sku: 'SKU-002' });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.currentPage).toBeDefined();
    });

    it('should support pagination', async () => {
      // Create multiple products
      for (let i = 1; i <= 15; i++) {
        await testHelpers.createTestProduct({ 
          name: `Product ${i}`, 
          sku: `SKU-${i.toString().padStart(3, '0')}` 
        });
      }

      const response = await request(app)
        .get('/api/products?page=2&limit=10')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(5);
      expect(response.body.data.currentPage).toBe(2);
    });

    it('should support search functionality', async () => {
      await testHelpers.createTestProduct({ name: 'Apple Juice', sku: 'APP-001' });
      await testHelpers.createTestProduct({ name: 'Orange Juice', sku: 'ORA-001' });

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
        price: 15.99,
        costPrice: 8.99,
        categoryId: '507f1f77bcf86cd799439011',
        brandId: '507f1f77bcf86cd799439012',
        unitId: '507f1f77bcf86cd799439013',
        stockQuantity: 50,
        minStockLevel: 5
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

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
      await testHelpers.createTestProduct({ sku: 'DUP-001' });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Product',
          sku: 'DUP-001',
          price: 10.99,
          categoryId: '507f1f77bcf86cd799439011'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('SKU');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by ID', async () => {
      const product = await testHelpers.createTestProduct();

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
      const product = await testHelpers.createTestProduct();

      const updateData = {
        name: 'Updated Product',
        price: 19.99
      };

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should not update product without permissions', async () => {
      const product = await testHelpers.createTestProduct();

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
      const product = await testHelpers.createTestProduct();

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
      const product = await testHelpers.createTestProduct();

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
          price: 10.99,
          categoryId: '507f1f77bcf86cd799439011'
        },
        {
          name: 'Bulk Product 2',
          sku: 'BLK-002',
          price: 15.99,
          categoryId: '507f1f77bcf86cd799439011'
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
      await testHelpers.createTestProduct({ sku: 'EXIST-001' });

      const productsData = [
        {
          name: 'Valid Product',
          sku: 'VALID-001',
          price: 10.99,
          categoryId: '507f1f77bcf86cd799439011'
        },
        {
          name: 'Invalid Product',
          sku: 'EXIST-001', // Duplicate SKU
          price: 15.99,
          categoryId: '507f1f77bcf86cd799439011'
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