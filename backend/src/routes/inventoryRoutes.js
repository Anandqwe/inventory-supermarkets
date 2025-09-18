const express = require('express');
const router = express.Router();

// Controllers
const InventoryController = require('../controllers/inventoryController');

// Middleware
const { authenticateToken, requirePermission } = require('../middleware/auth');

/**
 * Inventory Management Routes
 * Handles stock adjustments, transfers, and inventory tracking
 */

// ============ STOCK ADJUSTMENT ROUTES ============

/**
 * @route   POST /api/inventory/adjustments
 * @desc    Create stock adjustment
 * @access  Private (requires 'manage_inventory' permission)
 */
router.post('/adjustments',
  authenticateToken,
  requirePermission('manage_inventory'),
  InventoryController.createStockAdjustment
);

/**
 * @route   GET /api/inventory/adjustments
 * @desc    Get stock adjustments with filtering
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/adjustments',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getStockAdjustments
);

/**
 * @route   GET /api/inventory/adjustments/:id
 * @desc    Get single stock adjustment
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/adjustments/:id',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getStockAdjustmentById
);

/**
 * @route   PUT /api/inventory/adjustments/:id/approve
 * @desc    Approve stock adjustment
 * @access  Private (requires 'approve_adjustments' permission)
 */
router.put('/adjustments/:id/approve',
  authenticateToken,
  requirePermission('approve_adjustments'),
  InventoryController.approveStockAdjustment
);

/**
 * @route   PUT /api/inventory/adjustments/:id/reject
 * @desc    Reject stock adjustment
 * @access  Private (requires 'approve_adjustments' permission)
 */
router.put('/adjustments/:id/reject',
  authenticateToken,
  requirePermission('approve_adjustments'),
  InventoryController.rejectStockAdjustment
);

// ============ STOCK TRANSFER ROUTES ============

/**
 * @route   POST /api/inventory/transfers
 * @desc    Create stock transfer
 * @access  Private (requires 'manage_transfers' permission)
 */
router.post('/transfers',
  authenticateToken,
  requirePermission('manage_transfers'),
  InventoryController.createStockTransfer
);

/**
 * @route   GET /api/inventory/transfers
 * @desc    Get stock transfers with filtering
 * @access  Private (requires 'view_transfers' permission)
 */
router.get('/transfers',
  authenticateToken,
  requirePermission('view_transfers'),
  InventoryController.getStockTransfers
);

/**
 * @route   GET /api/inventory/transfers/:id
 * @desc    Get single stock transfer
 * @access  Private (requires 'view_transfers' permission)
 */
router.get('/transfers/:id',
  authenticateToken,
  requirePermission('view_transfers'),
  InventoryController.getStockTransferById
);

/**
 * @route   PUT /api/inventory/transfers/:id/ship
 * @desc    Ship stock transfer
 * @access  Private (requires 'manage_transfers' permission)
 */
router.put('/transfers/:id/ship',
  authenticateToken,
  requirePermission('manage_transfers'),
  InventoryController.shipStockTransfer
);

/**
 * @route   PUT /api/inventory/transfers/:id/receive
 * @desc    Receive stock transfer
 * @access  Private (requires 'manage_transfers' permission)
 */
router.put('/transfers/:id/receive',
  authenticateToken,
  requirePermission('manage_transfers'),
  InventoryController.receiveStockTransfer
);

/**
 * @route   PUT /api/inventory/transfers/:id/cancel
 * @desc    Cancel stock transfer
 * @access  Private (requires 'manage_transfers' permission)
 */
router.put('/transfers/:id/cancel',
  authenticateToken,
  requirePermission('manage_transfers'),
  InventoryController.cancelStockTransfer
);

// ============ INVENTORY TRACKING ROUTES ============

/**
 * @route   GET /api/inventory/stock-levels
 * @desc    Get current stock levels
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/stock-levels',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getStockLevels
);

/**
 * @route   GET /api/inventory/low-stock
 * @desc    Get low stock alerts
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/low-stock',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getLowStockAlerts
);

/**
 * @route   GET /api/inventory/stock-movements
 * @desc    Get stock movement history
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/stock-movements',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getStockMovements
);

/**
 * @route   GET /api/inventory/reorder-suggestions
 * @desc    Get reorder suggestions
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/reorder-suggestions',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getReorderSuggestions
);

/**
 * @route   GET /api/inventory/valuation
 * @desc    Get inventory valuation
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/valuation',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getInventoryValuation
);

/**
 * @route   GET /api/inventory/dashboard
 * @desc    Get inventory dashboard data
 * @access  Private (requires 'view_inventory' permission)
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('view_inventory'),
  InventoryController.getInventoryDashboard
);

module.exports = router;