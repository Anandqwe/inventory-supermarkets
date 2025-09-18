const Invoice = require('../models/Invoice');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');

/**
 * Financial & Invoicing Controller
 * Handles invoice generation, payment tracking, and financial reports
 */
class FinancialController {
  /**
   * Create standalone invoice (not linked to sale)
   */
  static async createInvoice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        branch: branchId,
        customer,
        items,
        discount = { type: 'none', value: 0 },
        tax = { rate: 0, amount: 0 },
        terms,
        notes,
        dueDate
      } = req.body;

      // Validate branch
      const branch = await Branch.findById(branchId || req.user.branch._id);
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (req.user.branch._id.toString() !== branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Can only create invoices for your assigned branch'
          });
        }
      }

      // Process invoice items
      const processedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const lineTotal = item.unitPrice * item.quantity;
        const discountAmount = item.discount ? (lineTotal * item.discount) / 100 : 0;
        const discountedAmount = lineTotal - discountAmount;

        const processedItem = {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          discountAmount,
          lineTotal: discountedAmount
        };

        processedItems.push(processedItem);
        subtotal += discountedAmount;
      }

      // Calculate totals
      let totalDiscount = 0;
      if (discount.type === 'percentage') {
        totalDiscount = (subtotal * discount.value) / 100;
      } else if (discount.type === 'amount') {
        totalDiscount = Math.min(discount.value, subtotal);
      }

      const discountedSubtotal = subtotal - totalDiscount;
      const taxAmount = tax.rate ? (discountedSubtotal * tax.rate) / 100 : tax.amount;
      const grandTotal = discountedSubtotal + taxAmount;

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(branch.code);

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber,
        branch: branch._id,
        customer,
        items: processedItems,
        subtotal,
        discount,
        discountAmount: totalDiscount,
        tax: {
          rate: tax.rate,
          amount: taxAmount
        },
        total: grandTotal,
        amountDue: grandTotal,
        status: 'sent',
        terms,
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        generatedBy: req.user.userId
      });

      await invoice.save();

      // Populate the response
      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate('branch', 'name code address phone email')
        .populate('generatedBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: populatedInvoice
      });

    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get invoices with filtering and pagination
   */
  static async getInvoices(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        branch,
        status,
        startDate,
        endDate,
        customerName,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter
      const filter = {};

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        filter.branch = req.user.branch._id;
      } else if (branch) {
        filter.branch = branch;
      }

      // Status filter
      if (status) {
        filter.status = status;
      }

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endOfDay;
        }
      }

      // Customer name filter
      if (customerName) {
        filter['customer.name'] = { $regex: customerName, $options: 'i' };
      }

      // Search filter
      if (search) {
        filter.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.email': { $regex: search, $options: 'i' } },
          { 'customer.phone': { $regex: search, $options: 'i' } },
          { 'items.description': { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [invoices, total] = await Promise.all([
        Invoice.find(filter)
          .populate('branch', 'name code')
          .populate('sale', 'saleNumber')
          .populate('generatedBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Invoice.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Invoices retrieved successfully',
        data: invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(req, res) {
    try {
      const { id } = req.params;

      const invoice = await Invoice.findById(id)
        .populate('branch', 'name code address phone email')
        .populate('sale', 'saleNumber soldAt')
        .populate('generatedBy', 'firstName lastName email');

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (invoice.branch._id.toString() !== req.user.branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Invoice not from your branch'
          });
        }
      }

      res.json({
        success: true,
        message: 'Invoice retrieved successfully',
        data: invoice
      });

    } catch (error) {
      console.error('Get invoice by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Record payment for invoice
   */
  static async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, method, reference, notes } = req.body;

      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (invoice.branch.toString() !== req.user.branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Cannot record payment for invoices from other branches'
          });
        }
      }

      // Validate payment amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero'
        });
      }

      if (amount > invoice.amountDue) {
        return res.status(400).json({
          success: false,
          message: `Payment amount cannot exceed amount due: ${invoice.amountDue}`
        });
      }

      // Record payment
      const payment = {
        amount,
        method,
        reference,
        notes,
        paidAt: new Date(),
        recordedBy: req.user.userId
      };

      invoice.payments.push(payment);
      invoice.amountPaid += amount;
      invoice.amountDue -= amount;

      // Update invoice status
      if (invoice.amountDue <= 0) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
      } else if (invoice.amountPaid > 0) {
        invoice.status = 'partially_paid';
      }

      await invoice.save();

      // Populate the response
      const updatedInvoice = await Invoice.findById(id)
        .populate('branch', 'name code')
        .populate('payments.recordedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: updatedInvoice
      });

    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const invoice = await Invoice.findById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (invoice.branch.toString() !== req.user.branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Cannot update invoices from other branches'
          });
        }
      }

      // Validate status transition
      const validTransitions = {
        'draft': ['sent', 'cancelled'],
        'sent': ['paid', 'partially_paid', 'overdue', 'cancelled'],
        'partially_paid': ['paid', 'overdue', 'cancelled'],
        'paid': ['refunded'],
        'overdue': ['paid', 'partially_paid', 'cancelled'],
        'cancelled': [],
        'refunded': []
      };

      if (!validTransitions[invoice.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${invoice.status} to ${status}`
        });
      }

      // Update invoice
      invoice.status = status;
      invoice.notes = notes || invoice.notes;

      // Handle specific status updates
      switch (status) {
        case 'sent':
          invoice.sentAt = new Date();
          break;
        case 'cancelled':
          invoice.cancelledAt = new Date();
          invoice.cancelledBy = req.user.userId;
          break;
        case 'refunded':
          invoice.refundedAt = new Date();
          invoice.refundedBy = req.user.userId;
          break;
      }

      await invoice.save();

      // Populate the response
      const updatedInvoice = await Invoice.findById(id)
        .populate('branch', 'name code')
        .populate('cancelledBy', 'firstName lastName')
        .populate('refundedBy', 'firstName lastName');

      res.json({
        success: true,
        message: `Invoice ${status} successfully`,
        data: updatedInvoice
      });

    } catch (error) {
      console.error('Update invoice status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get financial reports
   */
  static async getFinancialReports(req, res) {
    try {
      const {
        startDate,
        endDate,
        branch,
        reportType = 'summary', // 'summary', 'sales', 'purchases', 'profit_loss'
        groupBy = 'month'
      } = req.query;

      // Build base filter
      const baseFilter = {};

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        baseFilter.branch = req.user.branch._id;
      } else if (branch) {
        baseFilter.branch = branch;
      }

      // Date range filter
      if (startDate || endDate) {
        baseFilter.createdAt = {};
        if (startDate) {
          baseFilter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          baseFilter.createdAt.$lte = endOfDay;
        }
      }

      // Group by configuration
      let dateGroupFormat;
      switch (groupBy) {
        case 'day':
          dateGroupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
          break;
        case 'week':
          dateGroupFormat = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
          break;
        case 'month':
          dateGroupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        case 'quarter':
          dateGroupFormat = { $dateToString: { format: "%Y-Q%q", date: "$createdAt" } };
          break;
        default:
          dateGroupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
      }

      let reportData;

      switch (reportType) {
        case 'sales':
          reportData = await getSalesReport(baseFilter, dateGroupFormat);
          break;
        case 'purchases':
          reportData = await getPurchasesReport(baseFilter, dateGroupFormat);
          break;
        case 'profit_loss':
          reportData = await getProfitLossReport(baseFilter, dateGroupFormat);
          break;
        case 'summary':
        default:
          reportData = await getFinancialSummary(baseFilter, dateGroupFormat);
          break;
      }

      res.json({
        success: true,
        message: `${reportType} report retrieved successfully`,
        data: reportData
      });

    } catch (error) {
      console.error('Get financial reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get outstanding invoices (overdue)
   */
  static async getOutstandingInvoices(req, res) {
    try {
      const { branch } = req.query;

      // Build filter
      const filter = {
        status: { $in: ['sent', 'partially_paid', 'overdue'] },
        amountDue: { $gt: 0 }
      };

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        filter.branch = req.user.branch._id;
      } else if (branch) {
        filter.branch = branch;
      }

      const invoices = await Invoice.find(filter)
        .populate('branch', 'name code')
        .populate('sale', 'saleNumber')
        .sort({ dueDate: 1 });

      // Calculate aging
      const today = new Date();
      const aged = invoices.map(invoice => {
        const dueDate = invoice.dueDate || invoice.createdAt;
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        let agingCategory;
        if (daysOverdue <= 0) {
          agingCategory = 'current';
        } else if (daysOverdue <= 30) {
          agingCategory = '1-30 days';
        } else if (daysOverdue <= 60) {
          agingCategory = '31-60 days';
        } else if (daysOverdue <= 90) {
          agingCategory = '61-90 days';
        } else {
          agingCategory = '90+ days';
        }

        return {
          ...invoice.toObject(),
          daysOverdue,
          agingCategory
        };
      });

      // Calculate aging summary
      const agingSummary = aged.reduce((acc, invoice) => {
        if (!acc[invoice.agingCategory]) {
          acc[invoice.agingCategory] = {
            count: 0,
            totalAmount: 0
          };
        }
        acc[invoice.agingCategory].count += 1;
        acc[invoice.agingCategory].totalAmount += invoice.amountDue;
        return acc;
      }, {});

      res.json({
        success: true,
        message: 'Outstanding invoices retrieved successfully',
        data: {
          invoices: aged,
          summary: agingSummary,
          totalOutstanding: aged.reduce((sum, inv) => sum + inv.amountDue, 0)
        }
      });

    } catch (error) {
      console.error('Get outstanding invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

/**
 * Helper function for sales report
 */
async function getSalesReport(filter, dateGroupFormat) {
  const salesFilter = { ...filter, status: 'completed' };
  
  const salesData = await Sale.aggregate([
    { $match: salesFilter },
    {
      $group: {
        _id: dateGroupFormat,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalDiscount: { $sum: '$discountAmount' },
        averageOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const summary = await Sale.aggregate([
    { $match: salesFilter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalDiscount: { $sum: '$discountAmount' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);

  return {
    salesData,
    summary: summary[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      averageOrderValue: 0
    }
  };
}

/**
 * Helper function for purchases report
 */
async function getPurchasesReport(filter, dateGroupFormat) {
  const purchasesFilter = { ...filter, status: 'completed' };
  
  const purchasesData = await Purchase.aggregate([
    { $match: purchasesFilter },
    {
      $group: {
        _id: dateGroupFormat,
        totalPurchases: { $sum: 1 },
        totalCost: { $sum: '$total' },
        totalDiscount: { $sum: '$discountAmount' },
        averageOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const summary = await Purchase.aggregate([
    { $match: purchasesFilter },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        totalCost: { $sum: '$total' },
        totalDiscount: { $sum: '$discountAmount' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);

  return {
    purchasesData,
    summary: summary[0] || {
      totalPurchases: 0,
      totalCost: 0,
      totalDiscount: 0,
      averageOrderValue: 0
    }
  };
}

/**
 * Helper function for profit & loss report
 */
async function getProfitLossReport(filter, dateGroupFormat) {
  const [salesReport, purchasesReport] = await Promise.all([
    getSalesReport(filter, dateGroupFormat),
    getPurchasesReport(filter, dateGroupFormat)
  ]);

  // Combine data for profit/loss calculation
  const profitLossData = [];
  const allPeriods = new Set([
    ...salesReport.salesData.map(s => s._id),
    ...purchasesReport.purchasesData.map(p => p._id)
  ]);

  for (const period of allPeriods) {
    const salesPeriod = salesReport.salesData.find(s => s._id === period) || 
      { totalRevenue: 0, totalDiscount: 0 };
    const purchasesPeriod = purchasesReport.purchasesData.find(p => p._id === period) || 
      { totalCost: 0, totalDiscount: 0 };

    const grossProfit = salesPeriod.totalRevenue - purchasesPeriod.totalCost;
    const netProfit = grossProfit; // Can be enhanced with operating expenses

    profitLossData.push({
      _id: period,
      revenue: salesPeriod.totalRevenue,
      cogs: purchasesPeriod.totalCost,
      grossProfit,
      netProfit,
      grossMargin: salesPeriod.totalRevenue > 0 ? (grossProfit / salesPeriod.totalRevenue) * 100 : 0
    });
  }

  profitLossData.sort((a, b) => a._id.localeCompare(b._id));

  return {
    profitLossData,
    summary: {
      totalRevenue: salesReport.summary.totalRevenue,
      totalCost: purchasesReport.summary.totalCost,
      grossProfit: salesReport.summary.totalRevenue - purchasesReport.summary.totalCost,
      grossMargin: salesReport.summary.totalRevenue > 0 ? 
        ((salesReport.summary.totalRevenue - purchasesReport.summary.totalCost) / salesReport.summary.totalRevenue) * 100 : 0
    }
  };
}

/**
 * Helper function for financial summary
 */
async function getFinancialSummary(filter, dateGroupFormat) {
  const [salesReport, purchasesReport, invoiceStats] = await Promise.all([
    getSalesReport(filter, dateGroupFormat),
    getPurchasesReport(filter, dateGroupFormat),
    getInvoiceStats(filter)
  ]);

  return {
    sales: salesReport.summary,
    purchases: purchasesReport.summary,
    invoices: invoiceStats,
    profitability: {
      grossProfit: salesReport.summary.totalRevenue - purchasesReport.summary.totalCost,
      grossMargin: salesReport.summary.totalRevenue > 0 ? 
        ((salesReport.summary.totalRevenue - purchasesReport.summary.totalCost) / salesReport.summary.totalRevenue) * 100 : 0
    }
  };
}

/**
 * Helper function for invoice statistics
 */
async function getInvoiceStats(filter) {
  const stats = await Invoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalInvoiceValue: { $sum: '$total' },
        totalPaid: { $sum: '$amountPaid' },
        totalOutstanding: { $sum: '$amountDue' }
      }
    }
  ]);

  return stats[0] || {
    totalInvoices: 0,
    totalInvoiceValue: 0,
    totalPaid: 0,
    totalOutstanding: 0
  };
}

/**
 * Helper function to generate invoice number
 */
async function generateInvoiceNumber(branchCode) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const prefix = `INV-${branchCode}-${year}${month}`;
  
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = lastInvoice.invoiceNumber.match(/(\d+)$/);
    if (lastNumber) {
      nextNumber = parseInt(lastNumber[1]) + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

module.exports = FinancialController;