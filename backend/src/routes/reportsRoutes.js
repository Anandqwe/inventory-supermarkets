/**
 * Reports Routes with Enhanced Features
 */
const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin, requireManager, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Basic Reports (All authenticated users can view their own data)
router.get('/daily', 
  requireManager,
  ReportsController.getDailyReport
);

router.get('/sales', 
  requireManager,
  ReportsController.getSalesReport
);

router.get('/products', 
  requireManager,
  ReportsController.getProductReport
);

router.get('/inventory', 
  requireManager,
  ReportsController.getInventoryReport
);

// Advanced Analytics (Manager+ only)
router.get('/profit-analysis', 
  requireManager,
  ReportsController.getProfitAnalysis
);

router.get('/customer-analysis', 
  requireManager,
  ReportsController.getCustomerAnalysis
);

module.exports = router;
