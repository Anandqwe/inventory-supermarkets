/**
 * Product Routes
 */
const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Product CRUD routes
router.post('/', requireManager, ProductController.createProduct);
router.get('/', ProductController.getAllProducts);
router.get('/search/:query', ProductController.searchProduct);
router.get('/categories', ProductController.getCategories);
router.get('/categories/:category/subcategories', ProductController.getSubcategories);
router.get('/low-stock', ProductController.getLowStockProducts);
router.get('/:id', ProductController.getProductById);
router.put('/:id', requireManager, ProductController.updateProduct);
router.delete('/:id', requireManager, ProductController.deleteProduct);

// Stock management routes
router.patch('/:id/stock', requireManager, ProductController.updateStock);

module.exports = router;
