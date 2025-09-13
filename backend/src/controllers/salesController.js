/**
 * Sales Controller
 * Handles sales transactions and related operations
 */
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');

class SalesController {
  /**
   * Create new sale
   */
  static createSale = asyncHandler(async (req, res) => {
    const {
      items,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod = 'cash',
      discountAmount = 0,
      discountPercentage = 0,
      notes
    } = req.body;

    // Validate required fields
    const validation = ValidationUtils.validateRequiredFields(req.body, ['items']);
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, validation.errors.map(err => ({ message: err })));
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return ResponseUtils.error(res, 'Items array is required and cannot be empty', 400);
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'upi', 'netbanking', 'credit'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return ResponseUtils.error(res, 'Invalid payment method', 400);
    }

    // Validate customer email if provided
    if (customerEmail && !ValidationUtils.isValidEmail(customerEmail)) {
      return ResponseUtils.error(res, 'Invalid email format', 400);
    }

    // Validate customer phone if provided
    if (customerPhone && !ValidationUtils.isValidPhone(customerPhone)) {
      return ResponseUtils.error(res, 'Invalid phone number format', 400);
    }

    // Validate discount amounts
    if (discountAmount < 0 || discountPercentage < 0 || discountPercentage > 100) {
      return ResponseUtils.error(res, 'Invalid discount values', 400);
    }

    // Validate each item and check stock availability
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Validate required item fields
      const itemValidation = ValidationUtils.validateRequiredFields(item, ['productId', 'quantity']);
      if (!itemValidation.isValid) {
        return ResponseUtils.validationError(res, itemValidation.errors.map(err => ({ 
          message: `Item validation: ${err}` 
        })));
      }

      // Validate product ID
      if (!ValidationUtils.isValidObjectId(item.productId)) {
        return ResponseUtils.error(res, `Invalid product ID: ${item.productId}`, 400);
      }

      // Validate quantity
      const quantityValidation = ValidationUtils.validateQuantity(item.quantity);
      if (!quantityValidation.isValid) {
        return ResponseUtils.validationError(res, quantityValidation.errors.map(err => ({ 
          message: `Item quantity: ${err}` 
        })));
      }

      // Get product details
      const product = await Product.findById(item.productId);
      if (!product) {
        return ResponseUtils.notFound(res, `Product not found: ${item.productId}`);
      }

      // Check stock availability
      if (product.quantity < item.quantity) {
        return ResponseUtils.error(res, 
          `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`, 
          400
        );
      }

      // Calculate item total
      const unitPrice = item.unitPrice || product.price;
      const itemTotal = unitPrice * item.quantity;
      const gstAmount = (itemTotal * product.gstRate) / 100;

      const processedItem = {
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        gstRate: product.gstRate,
        gstAmount
      };

      processedItems.push(processedItem);
      subtotal += itemTotal;
    }

    // Calculate totals
    let totalDiscount = 0;
    if (discountPercentage > 0) {
      totalDiscount = (subtotal * discountPercentage) / 100;
    } else if (discountAmount > 0) {
      totalDiscount = Math.min(discountAmount, subtotal);
    }

    const discountedAmount = subtotal - totalDiscount;
    const totalGST = processedItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const finalAmount = discountedAmount + totalGST;

    // Create sale
    const sale = new Sale({
      items: processedItems,
      subtotal,
      discountAmount: totalDiscount,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      gstAmount: totalGST,
      totalAmount: finalAmount,
      paymentMethod,
      customerName: customerName ? ValidationUtils.sanitizeString(customerName) : undefined,
      customerPhone: customerPhone ? customerPhone.replace(/\s+/g, '') : undefined,
      customerEmail: customerEmail ? customerEmail.toLowerCase() : undefined,
      notes: notes ? ValidationUtils.sanitizeString(notes) : undefined,
      cashierId: req.user.id
    });

    // Start transaction to ensure atomicity
    const session = await Sale.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Save the sale
        await sale.save({ session });

        // Update product quantities
        for (const item of processedItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            { 
              $inc: { quantity: -item.quantity },
              $set: { updatedBy: req.user.id }
            },
            { session }
          );
        }
      });

      await session.endSession();

      // Populate the sale with product and cashier details
      const populatedSale = await Sale.findById(sale._id)
        .populate('items.productId', 'name category brand')
        .populate('cashierId', 'fullName email');

      ResponseUtils.success(res, populatedSale, 'Sale created successfully', 201);

    } catch (error) {
      await session.endSession();
      throw error;
    }
  });

  /**
   * Get all sales with filtering and pagination
   */
  static getAllSales = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      paymentMethod,
      cashierId,
      customerName,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minAmount,
      maxAmount
    } = req.query;

    // Validate pagination
    const pagination = ValidationUtils.validatePagination({ page, limit });

    // Validate sorting
    const allowedSortFields = ['createdAt', 'totalAmount', 'customerName', 'paymentMethod'];
    const sort = ValidationUtils.validateSort(sortBy, sortOrder, allowedSortFields);

    // Build filter
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const startDateValidation = ValidationUtils.validateDate(startDate);
        if (startDateValidation.isValid) {
          filter.createdAt.$gte = startDateValidation.date;
        }
      }
      if (endDate) {
        const endDateValidation = ValidationUtils.validateDate(endDate);
        if (endDateValidation.isValid) {
          // Set to end of day
          const endOfDay = new Date(endDateValidation.date);
          endOfDay.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endOfDay;
        }
      }
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (cashierId && ValidationUtils.isValidObjectId(cashierId)) {
      filter.cashierId = cashierId;
    }

    if (customerName) {
      filter.customerName = { $regex: ValidationUtils.cleanSearchQuery(customerName), $options: 'i' };
    }

    if (minAmount !== undefined) {
      filter.totalAmount = { ...filter.totalAmount, $gte: parseFloat(minAmount) };
    }

    if (maxAmount !== undefined) {
      filter.totalAmount = { ...filter.totalAmount, $lte: parseFloat(maxAmount) };
    }

    // Get sales with pagination
    const skip = (pagination.page - 1) * pagination.limit;

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort(sort.sortObj)
        .skip(skip)
        .limit(pagination.limit)
        .populate('items.productId', 'name category brand')
        .populate('cashierId', 'fullName email'),
      Sale.countDocuments(filter)
    ]);

    ResponseUtils.paginated(res, sales, { ...pagination, total }, 'Sales retrieved successfully');
  });

  /**
   * Get sale by ID
   */
  static getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale ID', 400);
    }

    const sale = await Sale.findById(id)
      .populate('items.productId', 'name category brand sku barcode')
      .populate('cashierId', 'fullName email role');

    if (!sale) {
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    ResponseUtils.success(res, sale, 'Sale retrieved successfully');
  });

  /**
   * Get sales summary/statistics
   */
  static getSalesSummary = asyncHandler(async (req, res) => {
    const { period = 'today' } = req.query;

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          totalGST: { $sum: '$gstAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ];

    const [summary] = await Sale.aggregate(pipeline);

    // Get payment method breakdown
    const paymentMethodStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          productName: { $first: '$items.productName' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    const result = {
      period,
      dateRange: { startDate, endDate },
      summary: summary || {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        totalGST: 0,
        averageOrderValue: 0
      },
      paymentMethodStats,
      topProducts
    };

    ResponseUtils.success(res, result, 'Sales summary retrieved successfully');
  });

  /**
   * Get daily sales report
   */
  static getDailySalesReport = asyncHandler(async (req, res) => {
    const { date } = req.query;
    
    let targetDate;
    if (date) {
      const dateValidation = ValidationUtils.validateDate(date);
      if (!dateValidation.isValid) {
        return ResponseUtils.error(res, 'Invalid date format', 400);
      }
      targetDate = dateValidation.date;
    } else {
      targetDate = new Date();
    }

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Get daily summary
    const [dailySummary] = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          totalGST: { $sum: '$gstAmount' },
          totalItemsSold: { $sum: { $size: '$items' } }
        }
      }
    ]);

    // Get hourly breakdown
    const hourlyBreakdown = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get cashier performance
    const cashierPerformance = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: '$cashierId',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'cashier'
        }
      },
      {
        $project: {
          totalSales: 1,
          totalRevenue: 1,
          cashierName: { $arrayElemAt: ['$cashier.fullName', 0] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const result = {
      date: targetDate.toISOString().split('T')[0],
      summary: dailySummary || {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        totalGST: 0,
        totalItemsSold: 0
      },
      hourlyBreakdown,
      cashierPerformance
    };

    ResponseUtils.success(res, result, 'Daily sales report retrieved successfully');
  });

  /**
   * Update sale status or notes (Admin/Manager only)
   */
  static updateSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale ID', 400);
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    const updates = {};
    if (notes !== undefined) {
      updates.notes = notes ? ValidationUtils.sanitizeString(notes) : null;
    }

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('items.productId', 'name category brand')
     .populate('cashierId', 'fullName email');

    ResponseUtils.success(res, updatedSale, 'Sale updated successfully');
  });

  /**
   * Cancel/void sale (Admin only)
   */
  static cancelSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale ID', 400);
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    if (sale.status === 'cancelled') {
      return ResponseUtils.error(res, 'Sale is already cancelled', 400);
    }

    // Start transaction to restore stock
    const session = await Sale.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update sale status
        await Sale.findByIdAndUpdate(
          id,
          { 
            $set: { 
              status: 'cancelled',
              notes: reason ? `Cancelled: ${ValidationUtils.sanitizeString(reason)}` : 'Cancelled',
              cancelledAt: new Date(),
              cancelledBy: req.user.id
            }
          },
          { session }
        );

        // Restore product quantities
        for (const item of sale.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { 
              $inc: { quantity: item.quantity },
              $set: { updatedBy: req.user.id }
            },
            { session }
          );
        }
      });

      await session.endSession();

      ResponseUtils.success(res, { id }, 'Sale cancelled successfully');

    } catch (error) {
      await session.endSession();
      throw error;
    }
  });
}

module.exports = SalesController;
