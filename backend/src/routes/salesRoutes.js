/**
 * Sales Routes
 */
const express = require('express');
const SalesController = require('../controllers/salesController');
const { authenticateToken, requireAdmin, requireManager, requirePermission } = require('../middleware/auth');
const { invalidateSalesCaches } = require('../middleware/cache');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Sales routes
router.post('/', requirePermission('sales.create'), invalidateSalesCaches, SalesController.createSale);
router.get('/', requirePermission('sales.read'), SalesController.getAllSales);
router.get('/stats', requirePermission('sales.read'), SalesController.getSalesStats);
router.get('/date-range', requirePermission('sales.read'), SalesController.getSalesByDateRange);
router.get('/receipt/:receiptNumber', requirePermission('sales.read'), SalesController.getSaleByReceiptNumber);
router.get('/:id', requirePermission('sales.read'), SalesController.getSaleById);

// Update and management routes
router.put('/:id', requirePermission('sales.update'), invalidateSalesCaches, SalesController.updateSale);
router.delete('/:id', requirePermission('sales.delete'), invalidateSalesCaches, SalesController.deleteSale);
router.post('/:id/refund', requirePermission('sales.refund'), invalidateSalesCaches, SalesController.refundSale);

module.exports = router;
