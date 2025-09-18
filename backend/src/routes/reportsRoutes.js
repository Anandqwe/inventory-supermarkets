/**
 * Reports Routes with Enhanced Features
 */
const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { authenticateToken, checkPermission, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Basic Reports (All authenticated users can view their own data)
router.get('/daily', 
  checkPermission('reports:read'),
  ReportsController.getDailyReport
);

router.get('/sales', 
  checkPermission('reports:read'),
  ReportsController.getSalesReport
);

router.get('/products', 
  checkPermission('reports:read'),
  ReportsController.getProductReport
);

router.get('/inventory', 
  checkPermission('reports:read'),
  ReportsController.getInventoryReport
);

// Advanced Analytics (Manager+ only)
router.get('/profit-analysis', 
  requireRole(['Admin', 'Manager']),
  checkPermission('reports:analytics'),
  ReportsController.getProfitAnalysis
);

router.get('/customer-analysis', 
  requireRole(['Admin', 'Manager']),
  checkPermission('reports:analytics'),
  ReportsController.getCustomerAnalysis
);

module.exports = router;