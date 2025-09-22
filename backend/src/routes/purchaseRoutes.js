const express = require('express');
const router = express.Router();

// Controllers
const PurchaseController = require('../controllers/purchaseController');

// Middleware
const { authenticateToken, requireManager } = require('../middleware/auth');

/**
 * @route   POST /api/purchases/orders
 * @desc    Create purchase order
 * @access  Private (Manager+ only)
 */
router.post('/orders',
  authenticateToken,
  requireManager,
  PurchaseController.createPurchaseOrder
);

/**
 * @route   GET /api/purchases/orders
 * @desc    Get purchase orders
 * @access  Private (Manager+ only)
 */
router.get('/orders',
  authenticateToken,
  requireManager,
  PurchaseController.getPurchaseOrders
);

/**
 * @route   GET /api/purchases/orders/:id
 * @desc    Get purchase order by ID
 * @access  Private (Manager+ only)
 */
router.get('/orders/:id',
  authenticateToken,
  requireManager,
  PurchaseController.getPurchaseOrderById
);

/**
 * @route   PUT /api/purchases/orders/:id/status
 * @desc    Update purchase order status
 * @access  Private (Manager+ only)
 */
router.put('/orders/:id/status',
  authenticateToken,
  requireManager,
  PurchaseController.updatePurchaseOrderStatus
);

/**
 * @route   POST /api/purchases/orders/:id/receive
 * @desc    Receive purchase order
 * @access  Private (Manager+ only)
 */
router.post('/orders/:id/receive',
  authenticateToken,
  requireManager,
  PurchaseController.receivePurchaseOrder
);

/**
 * @route   GET /api/purchases/reorder-suggestions
 * @desc    Get reorder suggestions
 * @access  Private (Manager+ only)
 */
router.get('/reorder-suggestions',
  authenticateToken,
  requireManager,
  PurchaseController.getReorderSuggestions
);

/**
 * @route   GET /api/purchases/analytics
 * @desc    Get purchase analytics
 * @access  Private (Manager+ only)
 */
router.get('/analytics',
  authenticateToken,
  requireManager,
  PurchaseController.getPurchaseAnalytics
);

module.exports = router;