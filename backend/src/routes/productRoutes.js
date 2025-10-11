/**
 * Product Routes
 */
const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireManager, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Product CRUD routes
router.post('/', requirePermission('products.create'), ProductController.createProduct);
router.get('/', requirePermission('products.read'), ProductController.getAllProducts);
router.get('/search/:query', requirePermission('products.read'), ProductController.searchProduct);
router.get('/categories', requirePermission('products.read'), ProductController.getCategories);
router.get('/categories/:category/subcategories', requirePermission('products.read'), ProductController.getSubcategories);
router.get('/low-stock', requirePermission('products.read'), ProductController.getLowStockProducts);

// CSV Import/Export routes
router.get('/export', requirePermission('products.export'), ProductController.exportProducts);
router.post('/import', requirePermission('products.create'), ProductController.importProducts);

// Bulk operations
router.post('/bulk', requirePermission('products.create'), ProductController.createProductsBulk);

// Individual product routes
router.get('/:id', requirePermission('products.read'), ProductController.getProductById);
router.put('/:id', requirePermission('products.update'), ProductController.updateProduct);
router.delete('/:id', requirePermission('products.delete'), ProductController.deleteProduct);

// Stock management routes
router.patch('/:id/stock', requirePermission('inventory.update'), ProductController.updateStock);

module.exports = router;
