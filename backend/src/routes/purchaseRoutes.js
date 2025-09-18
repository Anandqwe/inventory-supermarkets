const express = require('express');
const router = express.Router();

// Controllers
const PurchaseController = require('../controllers/purchaseController');

// Middleware
const { authenticateToken, requirePermission } = require('../middleware/auth');

/**
 * Purchase Management Routes
 * Handles purchase orders, receiving, and supplier management
 */

// ============ PURCHASE ORDER ROUTES ============

/**
 * @route   POST /api/purchases/orders
 * @desc    Create purchase order
 * @access  Private (requires 'create_purchase_orders' permission)
 */
router.post('/orders',
  authenticateToken,
  requirePermission('create_purchase_orders'),
  PurchaseController.createPurchaseOrder
);

/**
 * @route   GET /api/purchases/orders
 * @desc    Get purchase orders with filtering
 * @access  Private (requires 'view_purchase_orders' permission)
 */
router.get('/orders',
  authenticateToken,
  requirePermission('view_purchase_orders'),
  PurchaseController.getPurchaseOrders
);

/**
 * @route   GET /api/purchases/orders/:id
 * @desc    Get single purchase order
 * @access  Private (requires 'view_purchase_orders' permission)
 */
router.get('/orders/:id',
  authenticateToken,
  requirePermission('view_purchase_orders'),
  PurchaseController.getPurchaseOrderById
);

/**
 * @route   PUT /api/purchases/orders/:id
 * @desc    Update purchase order
 * @access  Private (requires 'edit_purchase_orders' permission)
 */
router.put('/orders/:id',
  authenticateToken,
  requirePermission('edit_purchase_orders'),
  PurchaseController.updatePurchaseOrder
);

/**
 * @route   PUT /api/purchases/orders/:id/approve
 * @desc    Approve purchase order
 * @access  Private (requires 'approve_purchase_orders' permission)
 */
router.put('/orders/:id/approve',
  authenticateToken,
  requirePermission('approve_purchase_orders'),
  PurchaseController.approvePurchaseOrder
);

/**
 * @route   PUT /api/purchases/orders/:id/reject
 * @desc    Reject purchase order
 * @access  Private (requires 'approve_purchase_orders' permission)
 */
router.put('/orders/:id/reject',
  authenticateToken,
  requirePermission('approve_purchase_orders'),
  PurchaseController.rejectPurchaseOrder
);

/**
 * @route   PUT /api/purchases/orders/:id/send
 * @desc    Send purchase order to supplier
 * @access  Private (requires 'send_purchase_orders' permission)
 */
router.put('/orders/:id/send',
  authenticateToken,
  requirePermission('send_purchase_orders'),
  PurchaseController.sendPurchaseOrder
);

/**
 * @route   PUT /api/purchases/orders/:id/cancel
 * @desc    Cancel purchase order
 * @access  Private (requires 'cancel_purchase_orders' permission)
 */
router.put('/orders/:id/cancel',
  authenticateToken,
  requirePermission('cancel_purchase_orders'),
  PurchaseController.cancelPurchaseOrder
);

/**
 * @route   DELETE /api/purchases/orders/:id
 * @desc    Delete purchase order (if not approved)
 * @access  Private (requires 'delete_purchase_orders' permission)
 */
router.delete('/orders/:id',
  authenticateToken,
  requirePermission('delete_purchase_orders'),
  PurchaseController.deletePurchaseOrder
);

// ============ PURCHASE RECEIVING ROUTES ============

/**
 * @route   POST /api/purchases/orders/:id/receive
 * @desc    Create purchase receipt
 * @access  Private (requires 'receive_purchases' permission)
 */
router.post('/orders/:id/receive',
  authenticateToken,
  requirePermission('receive_purchases'),
  PurchaseController.createPurchaseReceipt
);

/**
 * @route   GET /api/purchases/receipts
 * @desc    Get purchase receipts
 * @access  Private (requires 'view_purchase_receipts' permission)
 */
router.get('/receipts',
  authenticateToken,
  requirePermission('view_purchase_receipts'),
  PurchaseController.getPurchaseReceipts
);

/**
 * @route   GET /api/purchases/receipts/:id
 * @desc    Get single purchase receipt
 * @access  Private (requires 'view_purchase_receipts' permission)
 */
router.get('/receipts/:id',
  authenticateToken,
  requirePermission('view_purchase_receipts'),
  PurchaseController.getPurchaseReceiptById
);

/**
 * @route   PUT /api/purchases/receipts/:id/complete
 * @desc    Complete purchase receipt
 * @access  Private (requires 'complete_purchase_receipts' permission)
 */
router.put('/receipts/:id/complete',
  authenticateToken,
  requirePermission('complete_purchase_receipts'),
  PurchaseController.completePurchaseReceipt
);

// ============ PURCHASE ANALYTICS ROUTES ============

/**
 * @route   GET /api/purchases/analytics/dashboard
 * @desc    Get purchase analytics dashboard
 * @access  Private (requires 'view_purchase_analytics' permission)
 */
router.get('/analytics/dashboard',
  authenticateToken,
  requirePermission('view_purchase_analytics'),
  PurchaseController.getPurchaseAnalytics
);

/**
 * @route   GET /api/purchases/analytics/supplier-performance
 * @desc    Get supplier performance analytics
 * @access  Private (requires 'view_supplier_analytics' permission)
 */
router.get('/analytics/supplier-performance',
  authenticateToken,
  requirePermission('view_supplier_analytics'),
  PurchaseController.getSupplierPerformance
);

/**
 * @route   GET /api/purchases/analytics/spending-trends
 * @desc    Get spending trends analytics
 * @access  Private (requires 'view_purchase_analytics' permission)
 */
router.get('/analytics/spending-trends',
  authenticateToken,
  requirePermission('view_purchase_analytics'),
  PurchaseController.getSpendingTrends
);

/**
 * @route   GET /api/purchases/analytics/cost-savings
 * @desc    Get cost savings analytics
 * @access  Private (requires 'view_purchase_analytics' permission)
 */
router.get('/analytics/cost-savings',
  authenticateToken,
  requirePermission('view_purchase_analytics'),
  PurchaseController.getCostSavings
);

// ============ UTILITY ROUTES ============

/**
 * @route   GET /api/purchases/next-po-number
 * @desc    Get next purchase order number
 * @access  Private (requires 'create_purchase_orders' permission)
 */
router.get('/next-po-number',
  authenticateToken,
  requirePermission('create_purchase_orders'),
  PurchaseController.getNextPONumber
);

/**
 * @route   GET /api/purchases/orders/:id/pdf
 * @desc    Generate purchase order PDF
 * @access  Private (requires 'view_purchase_orders' permission)
 */
router.get('/orders/:id/pdf',
  authenticateToken,
  requirePermission('view_purchase_orders'),
  PurchaseController.generatePurchaseOrderPDF
);

/**
 * @route   POST /api/purchases/orders/:id/email
 * @desc    Email purchase order to supplier
 * @access  Private (requires 'send_purchase_orders' permission)
 */
router.post('/orders/:id/email',
  authenticateToken,
  requirePermission('send_purchase_orders'),
  PurchaseController.emailPurchaseOrder
);

module.exports = router;