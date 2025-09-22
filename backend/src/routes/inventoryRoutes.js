const express = require('express');
const router = express.Router();

// Controllers
const InventoryController = require('../controllers/inventoryController');

// Middleware
const { authenticateToken, requireManager } = require('../middleware/auth');

/**
 * @route   POST /api/inventory/adjustments
 * @desc    Create stock adjustment
 * @access  Private (Manager+ only)
 */
router.post('/adjustments',
  authenticateToken,
  requireManager,
  InventoryController.createAdjustment
);

/**
 * @route   GET /api/inventory/adjustments
 * @desc    Get stock adjustments with filtering
 * @access  Private (Manager+ only)
 */
router.get('/adjustments',
  authenticateToken,
  requireManager,
  InventoryController.getAdjustments
);

/**
 * @route   POST /api/inventory/transfers
 * @desc    Create stock transfer
 * @access  Private (Manager+ only)
 */
router.post('/transfers',
  authenticateToken,
  requireManager,
  InventoryController.createTransfer
);

/**
 * @route   GET /api/inventory/transfers
 * @desc    Get stock transfers
 * @access  Private (Manager+ only)
 */
router.get('/transfers',
  authenticateToken,
  requireManager,
  InventoryController.getTransfers
);

/**
 * @route   PUT /api/inventory/transfers/:id/status
 * @desc    Update transfer status
 * @access  Private (Manager+ only)
 */
router.put('/transfers/:id/status',
  authenticateToken,
  requireManager,
  InventoryController.updateTransferStatus
);

/**
 * @route   GET /api/inventory/summary
 * @desc    Get inventory summary
 * @access  Private (Manager+ only)
 */
router.get('/summary',
  authenticateToken,
  requireManager,
  InventoryController.getInventorySummary
);

module.exports = router;