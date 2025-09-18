const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

class SalesController {
  static createSale = asyncHandler(async (req, res) => {
    const { 
      items, 
      customerName, 
      customerPhone, 
      customerEmail,
      paymentMethod = 'cash',
      discountPercentage = 0,
      taxPercentage = 0,
      branchId,
      notes
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(
        ResponseUtils.error('Items array is required and cannot be empty', 400)
      );
    }

    // Validate branch
    const targetBranchId = branchId || req.user.branch;
    const branch = await Branch.findById(targetBranchId);
    if (!branch) {
      return res.status(400).json(
        ResponseUtils.error('Invalid branch', 400)
      );
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (req.user.branch.toString() !== targetBranchId.toString()) {
        return res.status(403).json(
          ResponseUtils.error('Access denied - Can only create sales for your assigned branch', 403)
        );
      }
    }

    // Start transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let subtotal = 0;
      const saleItems = [];
      const stockUpdates = [];

      // Validate items and check stock availability
      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Find branch stock
        const branchStock = product.branchStocks.find(
          stock => stock.branch.toString() === targetBranchId.toString()
        );

        if (!branchStock) {
          throw new Error(`Product ${product.name} not available in this branch`);
        }

        // Check if sufficient stock is available
        const availableStock = branchStock.quantity - branchStock.reservedQuantity;
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
        }

        // Calculate pricing
        const unitPrice = product.pricing.sellingPrice;
        const itemTotal = item.quantity * unitPrice;
        subtotal += itemTotal;

        saleItems.push({
          product: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: unitPrice,
          total: itemTotal
        });

        // Prepare stock update
        stockUpdates.push({
          productId: item.productId,
          branchId: targetBranchId,
          quantity: item.quantity,
          newQuantity: branchStock.quantity - item.quantity
        });
      }

      // Calculate totals
      const discountAmount = (subtotal * discountPercentage) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = (afterDiscount * taxPercentage) / 100;
      const total = afterDiscount + taxAmount;

      // Generate sale number
      const saleNumber = `SAL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create sale record
      const sale = new Sale({
        saleNumber,
        branch: targetBranchId,
        items: saleItems,
        subtotal,
        discountPercentage,
        discountAmount,
        taxPercentage,
        taxAmount,
        total,
        customerName,
        customerPhone,
        customerEmail,
        paymentMethod: 'cash',
        paymentStatus: 'completed',
        status: 'completed',
        notes,
        createdBy: req.user.userId
      });

      await sale.save({ session });

      // Update stock quantities
      for (const update of stockUpdates) {
        await Product.updateOne(
          { 
            _id: update.productId,
            'branchStocks.branch': update.branchId
          },
          { 
            $set: { 'branchStocks.$.quantity': update.newQuantity }
          },
          { session }
        );
      }

      // Create audit log
      await AuditLog.create([{
        action: 'CREATE_SALE',
        resource: 'Sale',
        resourceId: sale._id,
        details: {
          saleNumber: sale.saleNumber,
          total: sale.total,
          itemCount: sale.items.length,
          branch: targetBranchId
        },
        userId: req.user.userId,
        userEmail: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });

      // Commit transaction
      await session.commitTransaction();

      // Populate the sale data for response
      const populatedSale = await Sale.findById(sale._id)
        .populate('branch', 'name code')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json(
        ResponseUtils.success('Sale created successfully', populatedSale, 201)
      );

    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      
      return res.status(400).json(
        ResponseUtils.error(error.message, 400)
      );
    } finally {
      session.endSession();
    }
  });

  static getAllSales = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      branchId,
      startDate,
      endDate,
      paymentMethod,
      status,
      customerName,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // Branch filter
    if (branchId) {
      filter.branch = branchId;
    } else if (req.user.role !== 'admin' && req.user.branch) {
      filter.branch = req.user.branch;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Payment method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Customer name filter
    if (customerName) {
      filter.customerName = { $regex: customerName, $options: 'i' };
    }

    // General search
    if (search) {
      filter.$or = [
        { saleNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortDirection };

    const total = await Sale.countDocuments(filter);
    const sales = await Sale.find(filter)
      .populate('branch', 'name code address')
      .populate('createdBy', 'firstName lastName email')
      .populate('items.product', 'name sku')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    };

    // Calculate summary statistics
    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const avgSaleAmount = sales.length > 0 ? totalSalesAmount / sales.length : 0;

    res.json(
      ResponseUtils.success('Sales retrieved successfully', {
        sales,
        pagination,
        summary: {
          totalSales: sales.length,
          totalAmount: totalSalesAmount,
          averageAmount: avgSaleAmount
        }
      })
    );
  });

  static getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid sale ID', 400)
      );
    }

    const sale = await Sale.findById(id)
      .populate('branch', 'name code address contact')
      .populate('createdBy', 'firstName lastName email')
      .populate('items.product', 'name sku barcode category brand')
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'brand', select: 'name' }
        ]
      });

    if (!sale) {
      return res.status(404).json(
        ResponseUtils.error('Sale not found', 404)
      );
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (sale.branch._id.toString() !== req.user.branch.toString()) {
        return res.status(403).json(
          ResponseUtils.error('Access denied - Sale belongs to different branch', 403)
        );
      }
    }

    res.json(
      ResponseUtils.success('Sale retrieved successfully', sale)
    );
  });

  static updateSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes, customerName, customerPhone, customerEmail } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid sale ID', 400)
      );
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json(
        ResponseUtils.error('Sale not found', 404)
      );
    }

    // Check if sale can be modified
    if (sale.status === 'completed' && status !== 'refunded') {
      return res.status(400).json(
        ResponseUtils.error('Completed sales cannot be modified', 400)
      );
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (sale.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json(
          ResponseUtils.error('Access denied - Sale belongs to different branch', 403)
        );
      }
    }

    const updateData = {
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (customerName) updateData.customerName = customerName;
    if (customerPhone) updateData.customerPhone = customerPhone;
    if (customerEmail) updateData.customerEmail = customerEmail;

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('branch', 'name code')
     .populate('createdBy', 'firstName lastName');

    // Create audit log
    await AuditLog.create({
      action: 'UPDATE_SALE',
      resource: 'Sale',
      resourceId: sale._id,
      details: {
        saleNumber: sale.saleNumber,
        changes: Object.keys(req.body),
        previousStatus: sale.status,
        newStatus: status
      },
      userId: req.user.userId,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(
      ResponseUtils.success('Sale updated successfully', updatedSale)
    );
  });

  static deleteSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid sale ID', 400)
      );
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json(
        ResponseUtils.error('Sale not found', 404)
      );
    }

    // Check if sale can be deleted
    if (sale.status === 'completed') {
      return res.status(400).json(
        ResponseUtils.error('Completed sales cannot be deleted. Use refund instead.', 400)
      );
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (sale.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json(
          ResponseUtils.error('Access denied - Sale belongs to different branch', 403)
        );
      }
    }

    // Start transaction to restore stock
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Restore stock quantities
      for (const item of sale.items) {
        await Product.updateOne(
          { 
            _id: item.product,
            'branchStocks.branch': sale.branch
          },
          { 
            $inc: { 'branchStocks.$.quantity': item.quantity }
          },
          { session }
        );
      }

      // Soft delete the sale
      await Sale.findByIdAndUpdate(
        id,
        { 
          status: 'cancelled',
          deletedAt: new Date(),
          deletedBy: req.user.userId
        },
        { session }
      );

      // Create audit log
      await AuditLog.create([{
        action: 'DELETE_SALE',
        resource: 'Sale',
        resourceId: sale._id,
        details: {
          saleNumber: sale.saleNumber,
          total: sale.total,
          itemCount: sale.items.length,
          reason: 'Sale cancelled and stock restored'
        },
        userId: req.user.userId,
        userEmail: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });

      await session.commitTransaction();

      res.json(
        ResponseUtils.success('Sale cancelled successfully and stock restored')
      );

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  static getSalesStats = asyncHandler(async (req, res) => {
    const { 
      branchId,
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      endDate = new Date()
    } = req.query;

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Branch filter
    if (branchId) {
      filter.branch = branchId;
    } else if (req.user.role !== 'admin' && req.user.branch) {
      filter.branch = req.user.branch;
    }

    const stats = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalDiscount: { $sum: '$discountAmount' },
          totalTax: { $sum: '$taxAmount' },
          averageOrderValue: { $avg: '$total' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);

    // Payment method breakdown
    const paymentStats = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    // Daily sales trend
    const dailyTrend = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailySales: { $sum: 1 },
          dailyRevenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const result = {
      summary: stats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        totalTax: 0,
        averageOrderValue: 0,
        totalItems: 0
      },
      paymentMethods: paymentStats,
      dailyTrend,
      period: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    };

    res.json(
      ResponseUtils.success('Sales statistics retrieved successfully', result)
    );
  });

  static refundSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { refundAmount, refundReason, refundItems = [] } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return res.status(400).json(
        ResponseUtils.error('Invalid sale ID', 400)
      );
    }

    const sale = await Sale.findById(id).populate('items.product');
    if (!sale) {
      return res.status(404).json(
        ResponseUtils.error('Sale not found', 404)
      );
    }

    if (sale.status !== 'completed') {
      return res.status(400).json(
        ResponseUtils.error('Only completed sales can be refunded', 400)
      );
    }

    // Check branch access
    if (req.user.role !== 'admin' && req.user.branch) {
      if (sale.branch.toString() !== req.user.branch.toString()) {
        return res.status(403).json(
          ResponseUtils.error('Access denied - Sale belongs to different branch', 403)
        );
      }
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // If partial refund, restore stock for refunded items
      if (refundItems.length > 0) {
        for (const refundItem of refundItems) {
          const saleItem = sale.items.find(item => 
            item.product._id.toString() === refundItem.productId
          );
          
          if (saleItem && refundItem.quantity <= saleItem.quantity) {
            // Restore stock
            await Product.updateOne(
              { 
                _id: refundItem.productId,
                'branchStocks.branch': sale.branch
              },
              { 
                $inc: { 'branchStocks.$.quantity': refundItem.quantity }
              },
              { session }
            );
          }
        }
      } else {
        // Full refund - restore all items
        for (const item of sale.items) {
          await Product.updateOne(
            { 
              _id: item.product._id,
              'branchStocks.branch': sale.branch
            },
            { 
              $inc: { 'branchStocks.$.quantity': item.quantity }
            },
            { session }
          );
        }
      }

      // Update sale status
      const updateData = {
        status: 'refunded',
        refund: {
          amount: refundAmount || sale.total,
          reason: refundReason,
          items: refundItems,
          refundedAt: new Date(),
          refundedBy: req.user.userId
        }
      };

      const refundedSale = await Sale.findByIdAndUpdate(
        id,
        updateData,
        { new: true, session }
      );

      // Create audit log
      await AuditLog.create([{
        action: 'REFUND_SALE',
        resource: 'Sale',
        resourceId: sale._id,
        details: {
          saleNumber: sale.saleNumber,
          refundAmount: refundAmount || sale.total,
          refundReason,
          itemsRefunded: refundItems.length || sale.items.length
        },
        userId: req.user.userId,
        userEmail: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }], { session });

      await session.commitTransaction();

      res.json(
        ResponseUtils.success('Sale refunded successfully', refundedSale)
      );

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  static getSalesByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate, branchId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json(
        ResponseUtils.error('Start date and end date are required', 400)
      );
    }

    const filter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (branchId) {
      filter.branch = branchId;
    } else if (req.user.role !== 'admin') {
      filter.branch = req.user.branchId;
    }

    const sales = await Sale.find(filter)
      .populate('branch')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);

    res.json(
      ResponseUtils.success('Sales retrieved successfully', {
        sales,
        summary: {
          totalSales: sales.length,
          totalAmount,
          totalDiscount,
          averageOrderValue: sales.length > 0 ? totalAmount / sales.length : 0
        }
      })
    );
  });
}

module.exports = SalesController;
