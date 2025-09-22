const express = require('express');
const router = express.Router();
const FinancialController = require('../controllers/financialController');
const { authenticateToken, requireAdmin, requireManager } = require('../middleware/auth');

/**
 * @route   POST /api/financial/invoices
 * @desc    Create new invoice
 * @access  Private (Admin/Manager)
 */
router.post('/invoices',
  authenticateToken,
  requireManager,
  FinancialController.createInvoice
);

/**
 * @route   GET /api/financial/invoices
 * @desc    Get all invoices with filters
 * @access  Private (Admin/Manager)
 */
router.get('/invoices',
  authenticateToken,
  requireManager,
  FinancialController.getInvoices
);

/**
 * @route   GET /api/financial/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private (Admin/Manager)
 */
router.get('/invoices/:id',
  authenticateToken,
  requireManager,
  FinancialController.getInvoiceById
);

/**
 * @route   POST /api/financial/payments
 * @desc    Record payment
 * @access  Private (Admin/Manager)
 */
router.post('/payments',
  authenticateToken,
  requireManager,
  FinancialController.recordPayment
);

/**
 * @route   PUT /api/financial/invoices/:id/status
 * @desc    Update invoice status
 * @access  Private (Admin/Manager)
 */
router.put('/invoices/:id/status',
  authenticateToken,
  requireManager,
  FinancialController.updateInvoiceStatus
);

/**
 * @route   GET /api/financial/reports
 * @desc    Get financial reports
 * @access  Private (Admin only)
 */
router.get('/reports',
  authenticateToken,
  requireAdmin,
  FinancialController.getFinancialReports
);

/**
 * @route   GET /api/financial/outstanding
 * @desc    Get outstanding invoices
 * @access  Private (Admin/Manager)
 */
router.get('/outstanding',
  authenticateToken,
  requireManager,
  FinancialController.getOutstandingInvoices
);

module.exports = router;