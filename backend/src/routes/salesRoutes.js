/**
 * Sales Routes
 */
const express = require('express');
const SalesController = require('../controllers/salesController');
const { authenticateToken, requireAdmin, requireManager } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Sales routes
router.post('/', SalesController.createSale);
router.get('/', SalesController.getAllSales);
router.get('/summary', SalesController.getSalesSummary);
router.get('/daily-report', SalesController.getDailySalesReport);
router.get('/:id', SalesController.getSaleById);

// Admin/Manager only routes
router.put('/:id', requireManager, SalesController.updateSale);
router.post('/:id/cancel', requireAdmin, SalesController.cancelSale);

module.exports = router;
