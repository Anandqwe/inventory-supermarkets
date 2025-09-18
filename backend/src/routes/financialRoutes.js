const express = require('express');
const router = express.Router();

// Controllers
const FinancialController = require('../controllers/financialController');

// Middleware
const { authenticateToken, requirePermission } = require('../middleware/auth');

/**
 * Financial Management Routes
 * Handles invoicing, payments, and financial reporting
 */

// ============ INVOICE ROUTES ============

/**
 * @route   POST /api/financial/invoices
 * @desc    Create invoice
 * @access  Private (requires 'create_invoices' permission)
 */
router.post('/invoices',
  authenticateToken,
  requirePermission('create_invoices'),
  FinancialController.createInvoice
);

/**
 * @route   GET /api/financial/invoices
 * @desc    Get invoices with filtering
 * @access  Private (requires 'view_invoices' permission)
 */
router.get('/invoices',
  authenticateToken,
  requirePermission('view_invoices'),
  FinancialController.getInvoices
);

/**
 * @route   GET /api/financial/invoices/:id
 * @desc    Get single invoice
 * @access  Private (requires 'view_invoices' permission)
 */
router.get('/invoices/:id',
  authenticateToken,
  requirePermission('view_invoices'),
  FinancialController.getInvoiceById
);

/**
 * @route   PUT /api/financial/invoices/:id
 * @desc    Update invoice
 * @access  Private (requires 'edit_invoices' permission)
 */
router.put('/invoices/:id',
  authenticateToken,
  requirePermission('edit_invoices'),
  FinancialController.updateInvoice
);

/**
 * @route   PUT /api/financial/invoices/:id/send
 * @desc    Send invoice to customer
 * @access  Private (requires 'send_invoices' permission)
 */
router.put('/invoices/:id/send',
  authenticateToken,
  requirePermission('send_invoices'),
  FinancialController.sendInvoice
);

/**
 * @route   PUT /api/financial/invoices/:id/void
 * @desc    Void invoice
 * @access  Private (requires 'void_invoices' permission)
 */
router.put('/invoices/:id/void',
  authenticateToken,
  requirePermission('void_invoices'),
  FinancialController.voidInvoice
);

/**
 * @route   DELETE /api/financial/invoices/:id
 * @desc    Delete invoice (if not sent)
 * @access  Private (requires 'delete_invoices' permission)
 */
router.delete('/invoices/:id',
  authenticateToken,
  requirePermission('delete_invoices'),
  FinancialController.deleteInvoice
);

// ============ PAYMENT ROUTES ============

/**
 * @route   POST /api/financial/invoices/:id/payments
 * @desc    Record payment for invoice
 * @access  Private (requires 'record_payments' permission)
 */
router.post('/invoices/:id/payments',
  authenticateToken,
  requirePermission('record_payments'),
  FinancialController.recordPayment
);

/**
 * @route   GET /api/financial/payments
 * @desc    Get payments with filtering
 * @access  Private (requires 'view_payments' permission)
 */
router.get('/payments',
  authenticateToken,
  requirePermission('view_payments'),
  FinancialController.getPayments
);

/**
 * @route   GET /api/financial/payments/:id
 * @desc    Get single payment
 * @access  Private (requires 'view_payments' permission)
 */
router.get('/payments/:id',
  authenticateToken,
  requirePermission('view_payments'),
  FinancialController.getPaymentById
);

/**
 * @route   PUT /api/financial/payments/:id/void
 * @desc    Void payment
 * @access  Private (requires 'void_payments' permission)
 */
router.put('/payments/:id/void',
  authenticateToken,
  requirePermission('void_payments'),
  FinancialController.voidPayment
);

// ============ FINANCIAL REPORTING ROUTES ============

/**
 * @route   GET /api/financial/reports/profit-loss
 * @desc    Get profit & loss statement
 * @access  Private (requires 'view_financial_reports' permission)
 */
router.get('/reports/profit-loss',
  authenticateToken,
  requirePermission('view_financial_reports'),
  FinancialController.getProfitLossStatement
);

/**
 * @route   GET /api/financial/reports/cash-flow
 * @desc    Get cash flow statement
 * @access  Private (requires 'view_financial_reports' permission)
 */
router.get('/reports/cash-flow',
  authenticateToken,
  requirePermission('view_financial_reports'),
  FinancialController.getCashFlowStatement
);

/**
 * @route   GET /api/financial/reports/accounts-receivable
 * @desc    Get accounts receivable report
 * @access  Private (requires 'view_financial_reports' permission)
 */
router.get('/reports/accounts-receivable',
  authenticateToken,
  requirePermission('view_financial_reports'),
  FinancialController.getAccountsReceivableReport
);

/**
 * @route   GET /api/financial/reports/revenue-analysis
 * @desc    Get revenue analysis
 * @access  Private (requires 'view_financial_reports' permission)
 */
router.get('/reports/revenue-analysis',
  authenticateToken,
  requirePermission('view_financial_reports'),
  FinancialController.getRevenueAnalysis
);

/**
 * @route   GET /api/financial/reports/payment-trends
 * @desc    Get payment trends analysis
 * @access  Private (requires 'view_financial_reports' permission)
 */
router.get('/reports/payment-trends',
  authenticateToken,
  requirePermission('view_financial_reports'),
  FinancialController.getPaymentTrends
);

/**
 * @route   GET /api/financial/dashboard
 * @desc    Get financial dashboard data
 * @access  Private (requires 'view_financial_dashboard' permission)
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('view_financial_dashboard'),
  FinancialController.getFinancialDashboard
);

// ============ UTILITY ROUTES ============

/**
 * @route   GET /api/financial/next-invoice-number
 * @desc    Get next invoice number
 * @access  Private (requires 'create_invoices' permission)
 */
router.get('/next-invoice-number',
  authenticateToken,
  requirePermission('create_invoices'),
  FinancialController.getNextInvoiceNumber
);

/**
 * @route   GET /api/financial/invoices/:id/pdf
 * @desc    Generate invoice PDF
 * @access  Private (requires 'view_invoices' permission)
 */
router.get('/invoices/:id/pdf',
  authenticateToken,
  requirePermission('view_invoices'),
  FinancialController.generateInvoicePDF
);

/**
 * @route   POST /api/financial/invoices/:id/email
 * @desc    Email invoice to customer
 * @access  Private (requires 'send_invoices' permission)
 */
router.post('/invoices/:id/email',
  authenticateToken,
  requirePermission('send_invoices'),
  FinancialController.emailInvoice
);

/**
 * @route   GET /api/financial/tax-summary
 * @desc    Get tax summary report
 * @access  Private (requires 'view_tax_reports' permission)
 */
router.get('/tax-summary',
  authenticateToken,
  requirePermission('view_tax_reports'),
  FinancialController.getTaxSummary
);

/**
 * @route   POST /api/financial/bulk-invoice
 * @desc    Create bulk invoices
 * @access  Private (requires 'create_bulk_invoices' permission)
 */
router.post('/bulk-invoice',
  authenticateToken,
  requirePermission('create_bulk_invoices'),
  FinancialController.createBulkInvoices
);

module.exports = router;