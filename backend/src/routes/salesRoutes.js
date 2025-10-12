/**
 * Sales Routes
 */
const express = require('express');
const SalesController = require('../controllers/salesController');
const {
  authenticateToken,
  requirePermission
} = require('../middleware/auth');
const { invalidateSalesCaches } = require('../middleware/cache');
const { applyBranchScope } = require('../middleware/branchScope');
const { PERMISSIONS } = require('../../../shared/permissions');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Sales routes
router.post(
  '/',
  requirePermission(PERMISSIONS.SALES.CREATE),
  invalidateSalesCaches,
  SalesController.createSale
);

router.get(
  '/',
  applyBranchScope({ field: 'branch', param: 'branchId', allowMultiple: true }),
  requirePermission(PERMISSIONS.SALES.READ),
  SalesController.getAllSales
);

router.get(
  '/stats',
  applyBranchScope({ field: 'branch', param: 'branchId', allowMultiple: true, attachProperty: null }),
  requirePermission(PERMISSIONS.SALES.READ),
  SalesController.getSalesStats
);

router.get(
  '/date-range',
  applyBranchScope({ field: 'branch', param: 'branchId', allowMultiple: true }),
  requirePermission(PERMISSIONS.SALES.READ),
  SalesController.getSalesByDateRange
);

router.get(
  '/receipt/:receiptNumber',
  requirePermission(PERMISSIONS.SALES.READ),
  SalesController.getSaleByReceiptNumber
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.SALES.READ),
  SalesController.getSaleById
);

// Update and management routes
router.put(
  '/:id',
  requirePermission(PERMISSIONS.SALES.UPDATE),
  invalidateSalesCaches,
  SalesController.updateSale
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.SALES.DELETE),
  invalidateSalesCaches,
  SalesController.deleteSale
);

router.post(
  '/:id/refund',
  requirePermission(PERMISSIONS.SALES.REFUND),
  invalidateSalesCaches,
  SalesController.refundSale
);

module.exports = router;
