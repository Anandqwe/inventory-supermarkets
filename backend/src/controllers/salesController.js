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
      return ResponseUtils.error(res, 'Items array is required and cannot be empty', 400);
    }

    // Validate branch
    const targetBranchId = branchId || req.user.branch;
    

    
    const branch = await Branch.findById(targetBranchId);
    if (!branch) {
      return ResponseUtils.error(res, 'Invalid branch', 400);
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      const userBranchId = req.user.branch._id || req.user.branch;
      if (userBranchId.toString() !== targetBranchId.toString()) {
        return ResponseUtils.error(res, 'Access denied - Can only create sales for your assigned branch', 403);
      }
    }

    // Start transaction session (only if not in test environment)
    const useTransactions = process.env.NODE_ENV !== 'test';
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) {
      session.startTransaction();
    }

    try {
      let subtotal = 0;
      const saleItems = [];
      const stockUpdates = [];

      // Validate items and check stock availability
      for (const item of items) {
        const product = session ? 
          await Product.findById(item.productId).session(session) :
          await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Find branch stock
        const branchStock = product.stockByBranch.find(
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
          costPrice: product.pricing.costPrice,
          sellingPrice: product.pricing.sellingPrice,
          unitPrice: unitPrice,
          total: itemTotal,
          discount: 0,
          tax: 0
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
        status: 'completed',
        amountPaid: total,
        amountDue: 0,
        notes,
        createdBy: req.user.id
      });

      await sale.save(session ? { session } : {});

      // Update stock quantities
      for (const update of stockUpdates) {
        await Product.updateOne(
          { 
            _id: update.productId,
            'stockByBranch.branch': update.branchId
          },
          { 
            $set: { 'stockByBranch.$.quantity': update.newQuantity }
          },
          session ? { session } : {}
        );
      }

      // Create audit log
      await AuditLog.create([{
        action: 'sale_create',
        resourceType: 'sale',
        resourceId: sale._id.toString(),
        resourceName: sale.saleNumber,
        description: `Created sale: ${sale.saleNumber} (Total: ₹${sale.total})`,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        status: 'success',
        newValues: {
          saleNumber: sale.saleNumber,
          total: sale.total,
          itemCount: sale.items.length,
          branch: targetBranchId
        }
      }], session ? { session } : {});

      // Commit transaction
      if (session) {
        await session.commitTransaction();
      }

      // Populate the sale data for response
      const populatedSale = await Sale.findById(sale._id)
        .populate('branch', 'name code')
        .populate('createdBy', 'firstName lastName');

      return ResponseUtils.success(res, populatedSale, 'Sale created successfully', 201);

    } catch (error) {
      // Abort transaction on error
      if (session) {
        await session.abortTransaction();
      }
      

      
      return ResponseUtils.error(res, error.message, 400);
    } finally {
      if (session) {
        session.endSession();
      }
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

    return ResponseUtils.success(res, {
        sales,
        pagination,
        summary: {
          totalSales: sales.length,
          totalAmount: totalSalesAmount,
          averageAmount: avgSaleAmount
        }
      }, 'Sales retrieved successfully');
  });

  static getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale ID', 400);
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
      return ResponseUtils.error(res, 'Sale not found', 404);
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (sale.branch._id.toString() !== req.user.branch.toString()) {
        return ResponseUtils.error(res, 'Access denied - Sale belongs to different branch', 403);
      }
    }

    return ResponseUtils.success(res, sale, 'Sale retrieved successfully');
  });

  static getSaleByReceiptNumber = asyncHandler(async (req, res) => {
    const { receiptNumber } = req.params;

    const sale = await Sale.findOne({ saleNumber: receiptNumber })
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
      return ResponseUtils.error(res, 'Receipt not found', 404);
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      const userBranchId = req.user.branch._id || req.user.branch;
      const saleBranchId = sale.branch?._id || sale.branch;
      if (saleBranchId && saleBranchId.toString() !== userBranchId.toString()) {
        return ResponseUtils.error(res, 'Access denied - Sale belongs to different branch', 403);
      }
    }

    return ResponseUtils.success(res, sale, 'Receipt retrieved successfully');
  });

  static updateSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes, customerName, customerPhone, customerEmail } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale ID', 400);
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return ResponseUtils.error(res, 'Sale not found', 404);
    }

    // Check if sale can be modified
    if (sale.status === 'completed' && status !== 'refunded') {
      return ResponseUtils.error(res, 'Completed sales cannot be modified', 400);
    }

    // Check branch access for non-admin users
    if (req.user.role !== 'admin' && req.user.branch) {
      if (sale.branch.toString() !== req.user.branch.toString()) {
        return ResponseUtils.error(res, 'Access denied - Sale belongs to different branch', 403);
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
      action: 'sale_update',
      resourceType: 'sale',
      resourceId: sale._id.toString(),
      resourceName: sale.saleNumber,
      description: `Updated sale: ${sale.saleNumber}`,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent'),
      status: 'success',
      oldValues: {
        status: sale.status
      },
      newValues: {
        saleNumber: sale.saleNumber,
        changes: Object.keys(req.body),
        newStatus: status
      }
    });

    return ResponseUtils.success(res, updatedSale, 'Sale updated successfully');
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
            'stockByBranch.branch': sale.branch
          },
          { 
            $inc: { 'stockByBranch.$.quantity': item.quantity }
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
        action: 'sale_delete',
        resourceType: 'sale',
        resourceId: sale._id.toString(),
        resourceName: sale.saleNumber,
        description: `Deleted sale: ${sale.saleNumber} (Stock restored)`,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        status: 'success',
        oldValues: {
          saleNumber: sale.saleNumber,
          total: sale.total,
          itemCount: sale.items.length
        },
        newValues: {
          reason: 'Sale cancelled and stock restored'
        }
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
    const { refundAmount, refundReason, reason, refundItems = [], items = [] } = req.body;
    const finalReason = refundReason || reason;
    const itemsToRefund = refundItems.length > 0 ? refundItems : items;

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

    // Start transaction (only if not in test environment)
    const useTransactions = process.env.NODE_ENV !== 'test';
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) {
      session.startTransaction();
    }

    try {
      // If partial refund, restore stock for refunded items
      if (itemsToRefund.length > 0) {
        for (const refundItem of itemsToRefund) {
          const saleItem = sale.items.find(item => 
            item.product._id.toString() === refundItem.productId
          );
          
          if (saleItem && refundItem.quantity <= saleItem.quantity) {
            // Restore stock
            await Product.updateOne(
              { 
                _id: refundItem.productId,
                'stockByBranch.branch': sale.branch
              },
              { 
                $inc: { 'stockByBranch.$.quantity': refundItem.quantity }
              },
              ...(session ? [{ session }] : [])
            );
          }
        }
      } else {
        // Full refund - restore all items
        for (const item of sale.items) {
          await Product.updateOne(
            { 
              _id: item.product._id,
              'stockByBranch.branch': sale.branch
            },
            { 
              $inc: { 'stockByBranch.$.quantity': item.quantity }
            },
            ...(session ? [{ session }] : [])
          );
        }
      }

      // Calculate refund amount for partial refunds if not provided
      let finalRefundAmount = refundAmount;
      if (!finalRefundAmount) {
        if (itemsToRefund.length > 0) {
          // Partial refund - calculate based on refunded items
          finalRefundAmount = 0;
          for (const refundItem of itemsToRefund) {
            const saleItem = sale.items.find(item => 
              item.product._id.toString() === refundItem.productId
            );
            if (saleItem) {
              const itemRefundAmount = (saleItem.unitPrice * refundItem.quantity);
              finalRefundAmount += itemRefundAmount;
            }
          }
        } else {
          // Full refund
          finalRefundAmount = sale.total;
        }
      }

      // Update sale status
      const updateData = {
        status: 'refunded',
        refundedAmount: finalRefundAmount,
        refundReason: finalReason,
        refundedBy: req.user.userId,
        refundedAt: new Date()
      };

      const refundedSale = await Sale.findByIdAndUpdate(
        id,
        updateData,
        { new: true, ...(session ? { session } : {}) }
      ).populate('items.product');

      // Create audit log
      const auditData = [{
        action: 'sale_refund',
        resourceType: 'sale',
        resourceId: sale._id.toString(),
        resourceName: sale.saleNumber,
        description: `Refunded sale: ${sale.saleNumber} (Amount: ₹${finalRefundAmount})`,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        status: 'success',
        newValues: {
          saleNumber: sale.saleNumber,
          refundAmount: finalRefundAmount,
          refundReason: finalReason,
          itemsRefunded: itemsToRefund.length || sale.items.length
        }
      }];
      
      if (session) {
        await AuditLog.create(auditData, { session });
      } else {
        await AuditLog.create(auditData);
      }

      if (session) {
        await session.commitTransaction();
      }

      // Create refund object for response to match test expectations
      const saleWithRefund = {
        ...refundedSale.toObject(),
        refund: {
          amount: finalRefundAmount,
          reason: finalReason,
          items: itemsToRefund,
          refundedAt: refundedSale.refundedAt,
          refundedBy: refundedSale.refundedBy
        }
      };

      return ResponseUtils.success(res, saleWithRefund, 'Sale refunded successfully');

    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
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
