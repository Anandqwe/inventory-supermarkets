/**
 * Reports Routes with Enhanced Features
 */
const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin, requireManager, requireRole, requirePermission, requireAnyPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../../../shared/permissions');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Basic Reports (Managers and Viewers with reports.read permission)
router.get('/daily',
  requireAnyPermission([PERMISSIONS.REPORTS.READ, PERMISSIONS.REPORTS.ANALYTICS]),
  ReportsController.getDailyReport
);

router.get('/sales',
  requirePermission(PERMISSIONS.REPORTS.READ),
  ReportsController.getSalesReport
);

router.get('/products',
  requirePermission(PERMISSIONS.REPORTS.READ),
  ReportsController.getProductReport
);

router.get('/inventory',
  requirePermission(PERMISSIONS.REPORTS.READ),
  ReportsController.getInventoryReport
);

// Advanced Analytics (Manager+ only, not Viewer)
router.get('/profit-analysis',
  requireManager,
  ReportsController.getProfitAnalysis
);

router.get('/customer-analysis',
  requireManager,
  ReportsController.getCustomerAnalysis
);

module.exports = router;
