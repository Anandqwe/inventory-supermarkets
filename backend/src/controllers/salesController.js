const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  assertBranchWriteAccess,
  assertBranchReadAccess,
  getUserBranchId,
} = require('../middleware/branchScope');
const { hasCrossBranchAccess } = require('../../../shared/permissions');

const shouldUseTransactions = () => process.env.NODE_ENV !== 'test';

const normalizeQuantity = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveAccessibleBranchIds = (req, explicitBranchId) => {
  const branchIds = [];

  if (explicitBranchId && ValidationUtils.isValidObjectId(explicitBranchId)) {
    branchIds.push(String(explicitBranchId));
  }

  const scopedIds = Array.isArray(req.resolvedBranchIds) ? req.resolvedBranchIds : [];
  scopedIds.forEach((id) => {
    if (ValidationUtils.isValidObjectId(id)) {
      branchIds.push(String(id));
    }
  });

  const crossBranch = hasCrossBranchAccess(req.user?.role);

  if (!crossBranch) {
    const userBranchId = getUserBranchId(req.user);
    if (!userBranchId) {
      return { branchIds: [], error: 'BRANCH_REQUIRED' };
    }

    branchIds.push(String(userBranchId));
  }

  return { branchIds: Array.from(new Set(branchIds)), crossBranch };
};

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

    const targetBranchId = branchId || getUserBranchId(req.user);

    if (!targetBranchId) {
      return ResponseUtils.forbidden(res, 'Branch is required to create a sale');
    }

    if (!ValidationUtils.isValidObjectId(targetBranchId)) {
      return ResponseUtils.error(res, 'Invalid branch identifier', 400);
    }

    if (!assertBranchWriteAccess(targetBranchId, req.user)) {
      return ResponseUtils.forbidden(res, 'Cannot create sales for other branches');
    }

    const branch = await Branch.findById(targetBranchId);
    if (!branch || !branch.isActive) {
      return ResponseUtils.error(res, 'Branch not found or inactive', 400);
    }

    const useTransactions = shouldUseTransactions();
    const session = useTransactions ? await mongoose.startSession() : null;

    if (session) {
      session.startTransaction();
    }

    try {
      let subtotal = 0;
      const saleItems = [];
      const stockUpdates = [];

      for (const item of items) {
        if (!ValidationUtils.isValidObjectId(item.productId)) {
          return ResponseUtils.validationError(res, [{
            path: 'items.productId',
            message: 'Invalid product identifier',
            value: item.productId,
          }]);
        }

        const quantity = normalizeQuantity(item.quantity);
        if (!quantity) {
          return ResponseUtils.validationError(res, [{
            path: 'items.quantity',
            message: 'Quantity must be a positive number',
            value: item.quantity,
          }]);
        }

        const productQuery = Product.findById(item.productId);
        if (session) {
          productQuery.session(session);
        }

        const product = await productQuery;
        if (!product) {
          return ResponseUtils.error(res, `Product not found: ${item.productId}`, 400);
        }

        const branchStock = product.stockByBranch.find(
          (stock) => stock.branch.toString() === String(targetBranchId),
        );

        if (!branchStock) {
          return ResponseUtils.error(res, `Product ${product.name} not available in selected branch`, 400);
        }

        const availableStock = Number(branchStock.quantity || 0) - Number(branchStock.reservedQuantity || 0);
        if (availableStock < quantity) {
          return ResponseUtils.error(
            res,
            `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${quantity}`,
            400,
          );
        }

        const sellingPrice = Number(product?.pricing?.sellingPrice || 0);
        const costPrice = Number(product?.pricing?.costPrice || 0);
        const itemTotal = sellingPrice * quantity;

        subtotal += itemTotal;

        saleItems.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          quantity,
          costPrice,
          sellingPrice,
          unitPrice: sellingPrice,
          total: itemTotal,
          discount: 0,
          tax: 0,
        });

        stockUpdates.push({
          productId: product._id,
          newQuantity: Number(branchStock.quantity || 0) - quantity,
        });
      }

      const numericDiscount = Number(discountPercentage || 0);
      const discountAmount = (subtotal * numericDiscount) / 100;
      const total = subtotal - discountAmount;
      const taxRate = Number(taxPercentage || 18);
      const taxableAmount = taxRate > 0 ? total / (1 + taxRate / 100) : total;
      const taxAmount = total - taxableAmount;

      const saleNumber = `SAL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const sale = new Sale({
        saleNumber,
        branch: targetBranchId,
        items: saleItems,
        subtotal,
        discountPercentage: numericDiscount,
        discountAmount,
        taxPercentage: taxRate,
        taxAmount,
        total,
        customerName,
        customerPhone,
        customerEmail,
        paymentMethod,
        status: 'completed',
        amountPaid: total,
        amountDue: 0,
        notes,
        createdBy: req.user.userId,
      });

      await sale.save(session ? { session } : undefined);

      for (const update of stockUpdates) {
        await Product.updateOne(
          {
            _id: update.productId,
            'stockByBranch.branch': targetBranchId,
          },
          {
            $set: {
              'stockByBranch.$.quantity': update.newQuantity,
              'stockByBranch.$.lastUpdated': new Date(),
            },
          },
          session ? { session } : undefined,
        );
      }

      await AuditLog.create([{
        action: 'sale_create',
        resourceType: 'sale',
        resourceId: sale._id.toString(),
        resourceName: sale.saleNumber,
        description: `Created sale: ${sale.saleNumber} (Total: ₹${sale.total})`,
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        status: 'success',
        newValues: {
          saleNumber: sale.saleNumber,
          total: sale.total,
          itemCount: sale.items.length,
          branch: targetBranchId,
        },
      }], session ? { session } : undefined);

      if (session) {
        await session.commitTransaction();
      }

      const populatedSale = await Sale.findById(sale._id)
        .populate('branch', 'name code')
        .populate('createdBy', 'firstName lastName');

      return ResponseUtils.success(res, populatedSale, 'Sale created successfully', 201);
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }

      const statusCode = error.statusCode || 500;
      const message = error.statusCode ? error.message : 'Failed to create sale';
      return ResponseUtils.error(res, message, statusCode);
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

    const filters = [];

    const { branchIds, error } = resolveAccessibleBranchIds(req, branchId);
    if (error === 'BRANCH_REQUIRED') {
      return ResponseUtils.forbidden(res, 'Branch assignment required to view sales');
    }

    if (branchIds.length === 1) {
      filters.push({ branch: branchIds[0] });
    } else if (branchIds.length > 1) {
      filters.push({ branch: { $in: branchIds } });
    }

    if (startDate || endDate) {
      const range = {};
      if (startDate) {
        const parsed = new Date(startDate);
        if (Number.isNaN(parsed.valueOf())) {
          return ResponseUtils.error(res, 'Invalid start date', 400);
        }
        range.$gte = parsed;
      }
      if (endDate) {
        const parsed = new Date(endDate);
        if (Number.isNaN(parsed.valueOf())) {
          return ResponseUtils.error(res, 'Invalid end date', 400);
        }
        parsed.setHours(23, 59, 59, 999);
        range.$lte = parsed;
      }

      filters.push({ createdAt: range });
    }

    if (paymentMethod) {
      filters.push({ paymentMethod });
    }

    if (status) {
      filters.push({ status });
    }

    if (customerName) {
      filters.push({ customerName: { $regex: customerName, $options: 'i' } });
    }

    if (search) {
      filters.push({
        $or: [
          { saleNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } },
          { customerEmail: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const filter = filters.length > 0 ? { $and: filters } : {};

    const { page: pageNumber, limit: pageSize } = ValidationUtils.validatePagination({ page, limit });
    const skip = (pageNumber - 1) * pageSize;

    const { sortObj } = ValidationUtils.validateSort(sortBy, sortOrder, [
      'createdAt',
      'total',
      'saleNumber',
      'customerName',
    ]);

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('branch', 'name code address')
        .populate('createdBy', 'firstName lastName email')
        .populate('items.product', 'name sku')
        .sort(sortObj)
        .skip(skip)
        .limit(pageSize),
      Sale.countDocuments(filter),
    ]);

    const totalSalesAmount = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const avgSaleAmount = sales.length > 0 ? totalSalesAmount / sales.length : 0;

    const payload = {
      sales,
      summary: {
        totalSales: sales.length,
        totalAmount: totalSalesAmount,
        averageAmount: avgSaleAmount,
      },
    };

    return ResponseUtils.paginated(res, payload, {
      page: pageNumber,
      limit: pageSize,
      total,
    }, 'Sales retrieved successfully');
  });

  static getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale identifier', 400);
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
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    if (!assertBranchReadAccess(sale.branch, req.user)) {
      return ResponseUtils.forbidden(res, 'Sale belongs to a different branch');
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
      return ResponseUtils.notFound(res, 'Receipt not found');
    }

    if (!assertBranchReadAccess(sale.branch, req.user)) {
      return ResponseUtils.forbidden(res, 'Sale belongs to a different branch');
    }

    return ResponseUtils.success(res, sale, 'Receipt retrieved successfully');
  });

  static updateSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes, customerName, customerPhone, customerEmail } = req.body;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale identifier', 400);
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    // Check if sale can be modified
    if (sale.status === 'completed' && status !== 'refunded') {
      return ResponseUtils.error(res, 'Completed sales cannot be modified', 400);
    }

    if (!assertBranchWriteAccess(sale.branch, req.user)) {
      return ResponseUtils.forbidden(res, 'Sale belongs to a different branch');
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
      return ResponseUtils.error(res, 'Invalid sale identifier', 400);
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    // Check if sale can be deleted
    if (sale.status === 'completed') {
      return ResponseUtils.error(res, 'Completed sales cannot be deleted. Use refund instead.', 400);
    }

    if (!assertBranchWriteAccess(sale.branch, req.user)) {
      return ResponseUtils.forbidden(res, 'Sale belongs to a different branch');
    }

    const useTransactions = shouldUseTransactions();
    const session = useTransactions ? await mongoose.startSession() : null;

    if (session) {
      session.startTransaction();
    }

    try {
      for (const item of sale.items) {
        await Product.updateOne(
          { 
            _id: item.product,
            'stockByBranch.branch': sale.branch
          },
          { 
            $inc: { 'stockByBranch.$.quantity': item.quantity },
            $set: { 'stockByBranch.$.lastUpdated': new Date() }
          },
          session ? { session } : undefined
        );
      }

      await Sale.findByIdAndUpdate(
        id,
        { 
          status: 'cancelled',
          deletedAt: new Date(),
          deletedBy: req.user.userId
        },
        session ? { session } : undefined
      );

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
      }], session ? { session } : undefined);

      if (session) {
        await session.commitTransaction();
      }

      return ResponseUtils.success(res, null, 'Sale cancelled successfully and stock restored');

    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }

      return ResponseUtils.error(res, 'Failed to cancel sale');
    } finally {
      if (session) {
        session.endSession();
      }
    }
  });

  static getSalesStats = asyncHandler(async (req, res) => {
    const { 
      branchId,
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      endDate = new Date()
    } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      return ResponseUtils.error(res, 'Invalid date range', 400);
    }

    end.setHours(23, 59, 59, 999);

    const { branchIds, error } = resolveAccessibleBranchIds(req, branchId);
    if (error === 'BRANCH_REQUIRED') {
      return ResponseUtils.forbidden(res, 'Branch assignment required to view sales statistics');
    }

    const matchConditions = [{
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }];

    if (branchIds.length === 1) {
      matchConditions.push({ branch: mongoose.Types.ObjectId(branchIds[0]) });
    } else if (branchIds.length > 1) {
      matchConditions.push({ branch: { $in: branchIds.map((id) => mongoose.Types.ObjectId(id)) } });
    }

    const matchStage = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];

    const stats = await Sale.aggregate([
      { $match: matchStage },
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
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    const dailyTrend = await Sale.aggregate([
      { $match: matchStage },
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
        totalItems: 0,
      },
      paymentMethods: paymentStats,
      dailyTrend,
      period: {
        startDate: start,
        endDate: end,
      },
    };

    return ResponseUtils.success(res, result, 'Sales statistics retrieved successfully');
  });

  static refundSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { refundAmount, refundReason, reason, refundItems = [], items = [] } = req.body;
    const finalReason = refundReason || reason;
    const itemsToRefund = refundItems.length > 0 ? refundItems : items;

    if (!ValidationUtils.isValidObjectId(id)) {
      return ResponseUtils.error(res, 'Invalid sale identifier', 400);
    }

    const sale = await Sale.findById(id).populate('items.product');
    if (!sale) {
      return ResponseUtils.notFound(res, 'Sale not found');
    }

    if (sale.status !== 'completed') {
      return ResponseUtils.error(res, 'Only completed sales can be refunded', 400);
    }

    if (!assertBranchWriteAccess(sale.branch, req.user)) {
      return ResponseUtils.forbidden(res, 'Sale belongs to a different branch');
    }

    const useTransactions = shouldUseTransactions();
    const session = useTransactions ? await mongoose.startSession() : null;
    if (session) {
      session.startTransaction();
    }

    try {
      const updateOptions = session ? { session } : undefined;

      if (itemsToRefund.length > 0) {
        for (const refundItem of itemsToRefund) {
          if (!ValidationUtils.isValidObjectId(refundItem.productId)) {
            return ResponseUtils.validationError(res, [{
              path: 'refundItems.productId',
              message: 'Invalid product identifier',
              value: refundItem.productId,
            }]);
          }

          const quantity = normalizeQuantity(refundItem.quantity);
          if (!quantity) {
            return ResponseUtils.validationError(res, [{
              path: 'refundItems.quantity',
              message: 'Quantity must be a positive number',
              value: refundItem.quantity,
            }]);
          }

          const saleItem = sale.items.find(
            (item) => item.product._id.toString() === String(refundItem.productId),
          );

          if (!saleItem || quantity > saleItem.quantity) {
            return ResponseUtils.error(res, 'Invalid refund item quantity', 400);
          }

          await Product.updateOne(
            {
              _id: refundItem.productId,
              'stockByBranch.branch': sale.branch,
            },
            {
              $inc: { 'stockByBranch.$.quantity': quantity },
              $set: { 'stockByBranch.$.lastUpdated': new Date() },
            },
            updateOptions,
          );
        }
      } else {
        for (const item of sale.items) {
          await Product.updateOne(
            {
              _id: item.product._id,
              'stockByBranch.branch': sale.branch,
            },
            {
              $inc: { 'stockByBranch.$.quantity': item.quantity },
              $set: { 'stockByBranch.$.lastUpdated': new Date() },
            },
            updateOptions,
          );
        }
      }

      let finalRefundAmount = Number(refundAmount || 0);
      if (!finalRefundAmount) {
        if (itemsToRefund.length > 0) {
          finalRefundAmount = itemsToRefund.reduce((sum, refundItem) => {
            const saleItem = sale.items.find(
              (item) => item.product._id.toString() === String(refundItem.productId),
            );
            if (!saleItem) {
              return sum;
            }
            const quantity = Math.min(normalizeQuantity(refundItem.quantity) || 0, saleItem.quantity);
            return sum + (Number(saleItem.unitPrice || 0) * quantity);
          }, 0);
        } else {
          finalRefundAmount = Number(sale.total || 0);
        }
      }

      if (finalRefundAmount <= 0) {
        return ResponseUtils.error(res, 'Refund amount must be greater than zero', 400);
      }

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
        { new: true, ...updateOptions }
      ).populate('items.product');

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
      
      await AuditLog.create(auditData, updateOptions);

      if (session) {
        await session.commitTransaction();
      }

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
      return ResponseUtils.error(res, 'Failed to process sale refund');
    } finally {
      if (session) {
        session.endSession();
      }
    }
  });

  static getSalesByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate, branchId } = req.query;

    if (!startDate || !endDate) {
      return ResponseUtils.error(res, 'Start date and end date are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      return ResponseUtils.error(res, 'Invalid date range', 400);
    }

    end.setHours(23, 59, 59, 999);

    const { branchIds, error } = resolveAccessibleBranchIds(req, branchId);
    if (error === 'BRANCH_REQUIRED') {
      return ResponseUtils.forbidden(res, 'Branch assignment required to view sales');
    }

    const filters = [{
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }];

    if (branchIds.length === 1) {
      filters.push({ branch: branchIds[0] });
    } else if (branchIds.length > 1) {
      filters.push({ branch: { $in: branchIds } });
    }

    const filter = filters.length > 1 ? { $and: filters } : filters[0];

    const sales = await Sale.find(filter)
      .populate('branch')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);

    return ResponseUtils.success(res, {
      sales,
      summary: {
        totalSales: sales.length,
        totalAmount,
        totalDiscount,
        averageOrderValue: sales.length > 0 ? totalAmount / sales.length : 0,
      },
    }, 'Sales retrieved successfully');
  });
}

module.exports = SalesController;
