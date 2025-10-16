/**
 * Reports Routes with Enhanced Features
 */
const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin, requireManager, requireRole, requirePermission, requireAnyPermission } = require('../middleware/auth');
const { applyBranchScope } = require('../middleware/branchScope');
const { PERMISSIONS } = require('../../../shared/permissions');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Basic Reports (Managers and Viewers with reports.read permission)
router.get('/daily',
  applyBranchScope('branch'),
  requireAnyPermission([PERMISSIONS.REPORTS.READ, PERMISSIONS.REPORTS.ANALYTICS]),
  ReportsController.getDailyReport
);

router.get('/sales',
  applyBranchScope('branch'),
  requirePermission(PERMISSIONS.REPORTS.READ),
  ReportsController.getSalesReport
);

router.get('/products',
  applyBranchScope('branch'),
  requirePermission(PERMISSIONS.REPORTS.READ),
  ReportsController.getProductReport
);

router.get('/inventory',
  applyBranchScope('branch'),
  requirePermission(PERMISSIONS.REPORTS.READ),
  ReportsController.getInventoryReport
);

// Advanced Analytics (Manager+ only, not Viewer)
router.get('/profit-analysis',
  applyBranchScope('branch'),
  requireManager,
  ReportsController.getProfitAnalysis
);

router.get('/customer-analysis',
  applyBranchScope('branch'),
  requireManager,
  ReportsController.getCustomerAnalysis
);

module.exports = router;
