/**
 * Product Routes
 */
const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { applyBranchScope } = require('../middleware/branchScope');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Specific routes MUST come before parameter routes (:id)
// CSV Import/Export routes (specific paths)
router.get('/export', applyBranchScope('stockByBranch.branch'), requirePermission('products.export'), ProductController.exportProducts);
router.post('/import', requirePermission('products.create'), ProductController.importProducts);

// Other specific GET routes
router.get('/search/:query', applyBranchScope('stockByBranch.branch'), requirePermission('products.read'), ProductController.searchProduct);
router.get('/categories', requirePermission('products.read'), ProductController.getCategories);
router.get('/categories/:category/subcategories', requirePermission('products.read'), ProductController.getSubcategories);
router.get('/low-stock', applyBranchScope('stockByBranch.branch'), requirePermission('products.read'), ProductController.getLowStockProducts);

// Bulk operations
router.post('/bulk', requirePermission('products.create'), ProductController.createProductsBulk);

// Product CRUD routes (list and create)
router.post('/', requirePermission('products.create'), ProductController.createProduct);
router.get('/', applyBranchScope('stockByBranch.branch'), requirePermission('products.read'), ProductController.getAllProducts);

// Individual product routes (parameter routes must come last)
router.get('/:id', requirePermission('products.read'), ProductController.getProductById);
router.put('/:id', requirePermission('products.update'), ProductController.updateProduct);
router.delete('/:id', requirePermission('products.delete'), ProductController.deleteProduct);

// Stock management routes
router.patch('/:id/stock', requirePermission('inventory.update'), ProductController.updateStock);

module.exports = router;
