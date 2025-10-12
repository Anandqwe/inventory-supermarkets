const express = require('express');
const router = express.Router();

// Controllers
const InventoryController = require('../controllers/inventoryController');

// Middleware & Permissions
const {
  authenticateToken,
  requirePermission,
  requireAnyPermission
} = require('../middleware/auth');
const { applyBranchScope } = require('../middleware/branchScope');
const { PERMISSIONS } = require('../../../shared/permissions');

router.use(authenticateToken);

/**
 * @route   POST /api/inventory/adjustments
 * @desc    Create stock adjustment
 * @access  Private (Manager+ only)
 */
router.post('/adjustments',
  requireAnyPermission([
    PERMISSIONS.INVENTORY.ADJUST,
    PERMISSIONS.INVENTORY.UPDATE,
    PERMISSIONS.INVENTORY.CREATE
  ]),
  InventoryController.createAdjustment
);

/**
 * @route   GET /api/inventory/adjustments
 * @desc    Get stock adjustments with filtering
 * @access  Private (Manager+ only)
 */
router.get('/adjustments',
  applyBranchScope({ field: 'branch', param: 'branch', allowMultiple: true }),
  requirePermission(PERMISSIONS.INVENTORY.READ),
  InventoryController.getAdjustments
);

/**
 * @route   POST /api/inventory/transfers
 * @desc    Create stock transfer
 * @access  Private (Manager+ only)
 */
router.post('/transfers',
  requirePermission(PERMISSIONS.INVENTORY.TRANSFER),
  InventoryController.createTransfer
);

/**
 * @route   GET /api/inventory/transfers
 * @desc    Get stock transfers
 * @access  Private (Manager+ only)
 */
router.get('/transfers',
  applyBranchScope({ param: 'branch', allowMultiple: true, attachProperty: null, enforceForScopedRoles: false }),
  requirePermission(PERMISSIONS.INVENTORY.READ),
  InventoryController.getTransfers
);

/**
 * @route   PUT /api/inventory/transfers/:id/status
 * @desc    Update transfer status
 * @access  Private (Manager+ only)
 */
router.put('/transfers/:id/status',
  requireAnyPermission([
    PERMISSIONS.INVENTORY.TRANSFER,
    PERMISSIONS.INVENTORY.UPDATE
  ]),
  InventoryController.updateTransferStatus
);

/**
 * @route   GET /api/inventory/summary
 * @desc    Get inventory summary
 * @access  Private (Manager+ only)
 */
router.get('/summary',
  applyBranchScope({ field: 'branch', param: 'branch', allowMultiple: true }),
  requirePermission(PERMISSIONS.INVENTORY.READ),
  InventoryController.getInventorySummary
);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get low stock items
 * @access  Private (Manager+ only)
 */
router.get('/low-stock',
  applyBranchScope({ field: 'branch', param: 'branch', allowMultiple: true }),
  requirePermission(PERMISSIONS.INVENTORY.READ),
  InventoryController.getLowStockItems
);

module.exports = router;
