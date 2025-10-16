const mongoose = require('mongoose');
const Product = require('../models/Product');
const Adjustment = require('../models/Adjustment');
const Transfer = require('../models/Transfer');
const Purchase = require('../models/Purchase');
const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const {
  assertBranchWriteAccess,
  assertBranchReadAccess,
  getUserBranchId
} = require('../middleware/branchScope');
const { hasCrossBranchAccess } = require('../../../shared/permissions');

const isAdminUser = (user = {}) => String(user?.role || '').toLowerCase() === 'admin';

/**
 * Inventory Management Controller
 * Handles stock adjustments, transfers, and inventory operations
 */
class InventoryController {
  /**
   * Create stock adjustment
   */
  static async createAdjustment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const {
        branch: branchId,
        items,
        type,
        reason,
        notes
      } = req.body;

      const resolvedBranchId = branchId || getUserBranchId(req.user);

      if (!resolvedBranchId) {
        return ResponseUtils.error(res, 'Branch is required to create an adjustment', 400);
      }

      if (!ValidationUtils.isValidObjectId(resolvedBranchId)) {
        return ResponseUtils.error(res, 'Invalid branch identifier', 400);
      }

      if (!assertBranchWriteAccess(resolvedBranchId, req.user)) {
        return ResponseUtils.forbidden(res, 'Cannot adjust inventory for other branches');
      }

      const branch = await Branch.findById(resolvedBranchId);
      if (!branch) {
        return ResponseUtils.error(res, 'Branch not found', 404);
      }

      if (!Array.isArray(items) || items.length === 0) {
        return ResponseUtils.error(res, 'No items provided for adjustment', 400);
      }

      const adjustmentNumber = await generateAdjustmentNumber(branch.code);

      const session = await Adjustment.db.startSession();
      let adjustmentRecord;

      try {
        await session.withTransaction(async () => {
          const adjItems = [];

          for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
              throw new Error(`Product not found: ${item.product}`);
            }

            const branchStock = product.stockByBranch.find(
              (stock) => stock.branch.toString() === branch._id.toString()
            );

            const currentQuantity = branchStock ? branchStock.quantity : 0;
            const adjustedQuantity = Number(item.adjustedQuantity ?? currentQuantity);
            const difference = adjustedQuantity - currentQuantity;

            adjItems.push({
              product: product._id,
              productName: item.productName || product.name,
              sku: item.sku || product.sku,
              currentQuantity,
              adjustedQuantity,
              difference,
              unit: item.unit || (product.unit?.symbol || 'pcs'),
              reason
            });

            if (branchStock) {
              await Product.updateOne(
                { _id: product._id, 'stockByBranch.branch': branch._id },
                {
                  $set: {
                    'stockByBranch.$.quantity': adjustedQuantity,
                    'stockByBranch.$.lastUpdated': new Date()
                  }
                },
                { session }
              );
            } else {
              await Product.updateOne(
                { _id: product._id },
                {
                  $push: {
                    stockByBranch: {
                      branch: branch._id,
                      quantity: adjustedQuantity,
                      minLevel: 0,
                      maxLevel: 100,
                      lastUpdated: new Date()
                    }
                  }
                },
                { session }
              );
            }
          }

          const [createdAdjustment] = await Adjustment.create(
            [
              {
                adjustmentNumber,
                branch: branch._id,
                items: adjItems,
                type,
                reason,
                notes,
                createdBy: req.user.userId
              }
            ],
            { session }
          );

          adjustmentRecord = createdAdjustment;
        });
      } finally {
        await session.endSession();
      }

      if (!adjustmentRecord) {
        return ResponseUtils.error(res, 'Failed to create stock adjustment', 500);
      }

      const completeAdjustment = await Adjustment.findById(adjustmentRecord._id)
        .populate('branch', 'name code')
        .populate('items.product', 'name sku')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName');

      return ResponseUtils.success(res, completeAdjustment, 'Stock adjustment created successfully', 201);
    } catch (error) {
      console.error('Create adjustment error:', error);
      return ResponseUtils.error(res, 'Failed to create stock adjustment');
    }
  }

  /**
   * Get stock adjustments with filtering and pagination
   */
  static async getAdjustments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        product,
        type,
        startDate,
        endDate,
        reason,
        adjustedBy,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {};

      if (req.branchFilter) {
        Object.assign(filter, req.branchFilter);
      }

      if (product && ValidationUtils.isValidObjectId(product)) {
        filter['items.product'] = product;
      }

      if (type) {
        filter.type = type;
      }

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

      if (reason) {
        filter.reason = { $regex: reason, $options: 'i' };
      }

      if (adjustedBy && ValidationUtils.isValidObjectId(adjustedBy)) {
        filter.createdBy = adjustedBy;
      }

      if (search) {
        const productSearch = await Product.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');

        const productIds = productSearch.map((p) => p._id);

        filter.$or = [
          { adjustmentNumber: { $regex: search, $options: 'i' } },
          { reason: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { 'items.product': { $in: productIds } }
        ];
      }

      const { page: pageNumber, limit: pageSize } = ValidationUtils.validatePagination({ page, limit });
      const skip = (pageNumber - 1) * pageSize;

      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [adjustments, total] = await Promise.all([
        Adjustment.find(filter)
          .populate('branch', 'name code')
          .populate('items.product', 'name sku')
          .populate('createdBy', 'firstName lastName')
          .populate('approvedBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(pageSize),
        Adjustment.countDocuments(filter)
      ]);

      return ResponseUtils.paginated(res, adjustments, {
        page: pageNumber,
        limit: pageSize,
        total
      }, 'Stock adjustments retrieved successfully');
    } catch (error) {
      console.error('Get adjustments error:', error);
      return ResponseUtils.error(res, 'Failed to fetch stock adjustments');
    }
  }

  /**
   * Create stock transfer between branches
   */
  static async createTransfer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.validationError(res, errors.array());
      }

      const {
        fromBranch: fromBranchId,
        toBranch: toBranchId,
        items,
        notes,
        expectedDeliveryDate,
        reason
      } = req.body;

      if (!ValidationUtils.isValidObjectId(fromBranchId) || !ValidationUtils.isValidObjectId(toBranchId)) {
        return ResponseUtils.error(res, 'Invalid branch identifier', 400);
      }

      // Validate branches
      const [fromBranch, toBranch] = await Promise.all([
        Branch.findById(fromBranchId),
        Branch.findById(toBranchId)
      ]);

      if (!fromBranch) {
        return ResponseUtils.error(res, 'Invalid source branch', 400);
      }

      if (!toBranch) {
        return ResponseUtils.error(res, 'Invalid destination branch', 400);
      }

      if (fromBranchId === toBranchId) {
        return ResponseUtils.error(res, 'Source and destination branches cannot be the same', 400);
      }

      if (!assertBranchWriteAccess(fromBranchId, req.user)) {
        return ResponseUtils.forbidden(res, 'Cannot create transfers from other branches');
      }

      if (!Array.isArray(items) || items.length === 0) {
        return ResponseUtils.error(res, 'Transfer requires at least one item', 400);
      }

      const processedItems = [];

      for (const item of items) {
        // Validate product
        const product = await Product.findById(item.product);
        if (!product) {
          return ResponseUtils.error(res, `Product not found: ${item.product}`, 400);
        }

        // Check stock availability in source branch
        const fromBranchStock = product.stockByBranch.find(
          stock => stock.branch.toString() === fromBranchId
        );

        if (!fromBranchStock || fromBranchStock.quantity < item.quantity) {
          return ResponseUtils.error(
            res,
            `Insufficient stock for ${product.name} in source branch. Available: ${fromBranchStock?.quantity || 0}`,
            400
          );
        }

        processedItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitCost: item.unitCost || 0
        });
      }

      // Generate transfer number
      const transferNumber = await generateTransferNumber(fromBranch.code, toBranch.code);

      // Validate reason
      const validReasons = ['restock', 'demand', 'expiry', 'other'];
      const transferReason = reason || 'restock';
      if (!validReasons.includes(transferReason)) {
        return ResponseUtils.error(res, `Invalid reason. Must be one of: ${validReasons.join(', ')}`, 400);
      }

      // Format items for Transfer model
      const transferItems = processedItems.map(item => ({
        product: item.product,
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit || 'pcs'
      }));

      // Create transfer
      const transfer = new Transfer({
        transferNumber,
        fromBranch: fromBranch._id,
        toBranch: toBranch._id,
        items: transferItems,
        status: 'pending',
        reason: transferReason,
        notes: notes || '',
        transferDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(),
        createdBy: req.user.userId
      });

      await transfer.save();

      // Populate the response
      const populatedTransfer = await Transfer.findById(transfer._id)
        .populate('fromBranch', 'name code')
        .populate('toBranch', 'name code')
        .populate('createdBy', 'firstName lastName');

      return ResponseUtils.success(res, populatedTransfer, 'Transfer created successfully', 201);
    } catch (error) {
      console.error('Create transfer error:', error);
      return ResponseUtils.error(res, 'Failed to create stock transfer');
    }
  }

  /**
   * Update transfer status (ship, receive, cancel)
   */
  static async updateTransferStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, receivedItems } = req.body;

      if (!ValidationUtils.isValidObjectId(id)) {
        return ResponseUtils.error(res, 'Invalid transfer identifier', 400);
      }

      const transfer = await Transfer.findById(id);
      if (!transfer) {
        return ResponseUtils.notFound(res, 'Transfer not found');
      }

      const relatedBranches = [transfer.fromBranch, transfer.toBranch].filter(Boolean);
      const hasBranchAccess = relatedBranches.some((branchId) => assertBranchReadAccess(branchId, req.user));

      if (!hasBranchAccess) {
        return ResponseUtils.forbidden(res, 'Transfer not related to your branch');
      }

      if (!status) {
        return ResponseUtils.validationError(res, [{
          path: 'status',
          message: 'Status is required'
        }]);
      }

      // Validate status transition
      const validTransitions = {
        'pending': ['shipped', 'cancelled'],
        'shipped': ['received', 'cancelled'],
        'received': [],
        'cancelled': []
      };

      const allowedStatuses = validTransitions[transfer.status] || [];

      if (!allowedStatuses.includes(status)) {
        return ResponseUtils.error(
          res,
          `Cannot change status from ${transfer.status} to ${status}`,
          400
        );
      }

      // Ensure caller can write to the relevant branch for this status change
      const requiresToBranchAccess = status === 'received';
      const targetBranchId = requiresToBranchAccess ? transfer.toBranch : transfer.fromBranch;
      if (!assertBranchWriteAccess(targetBranchId, req.user)) {
        return ResponseUtils.forbidden(res, 'Insufficient branch permissions to update transfer status');
      }

      let normalizedReceivedItems = Array.isArray(receivedItems) ? receivedItems : null;
      if (normalizedReceivedItems && normalizedReceivedItems.length > 0) {
        const errors = [];
        const sanitized = [];

        for (const item of normalizedReceivedItems) {
          if (!item || !ValidationUtils.isValidObjectId(item.product)) {
            errors.push({ path: 'receivedItems.product', message: 'Invalid product identifier' });
            continue;
          }

          const matchingTransferItem = transfer.items.find((transferItem) => String(transferItem.product) === String(item.product));
          if (!matchingTransferItem) {
            errors.push({ path: 'receivedItems.product', message: 'Received item not part of transfer', value: item.product });
            continue;
          }

          const quantity = Number(item.quantity);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            errors.push({ path: 'receivedItems.quantity', message: 'Quantity must be a positive number', value: item.quantity });
            continue;
          }

          if (quantity > Number(matchingTransferItem.quantity || 0)) {
            errors.push({ path: 'receivedItems.quantity', message: 'Quantity exceeds amount shipped', value: item.quantity });
            continue;
          }

          sanitized.push({
            product: matchingTransferItem.product,
            quantity,
            sku: matchingTransferItem.sku,
            name: matchingTransferItem.name,
            unitCost: matchingTransferItem.unitCost
          });
        }

        if (errors.length > 0) {
          return ResponseUtils.validationError(res, errors);
        }

        normalizedReceivedItems = sanitized;
      } else {
        normalizedReceivedItems = null;
      }

      const previousStatus = transfer.status;

      // Start transaction for status updates that affect inventory
      const session = await Transfer.db.startSession();

      try {
        await session.withTransaction(async () => {
          // Update transfer status
          transfer.status = status;
          transfer.notes = notes || transfer.notes;

          // Handle specific status updates
          switch (status) {
          case 'shipped':
            transfer.shippedAt = new Date();
            transfer.shippedBy = req.user.userId;

            // Reserve stock in source branch (reduce quantity)
            for (const item of transfer.items) {
              const quantity = Number(item.quantity) || 0;
              if (quantity <= 0) {
                continue;
              }

              await Product.updateOne(
                {
                  _id: item.product,
                  'stockByBranch.branch': transfer.fromBranch
                },
                {
                  $inc: { 'stockByBranch.$.quantity': -quantity },
                  $set: { 'stockByBranch.$.lastUpdated': new Date() }
                },
                { session }
              );
            }
            break;

          case 'received':
            transfer.receivedAt = new Date();
            transfer.receivedBy = req.user.userId;
            transfer.receivedItems = normalizedReceivedItems && normalizedReceivedItems.length > 0
              ? normalizedReceivedItems
              : transfer.items;

            // Add stock to destination branch
            for (const item of transfer.receivedItems) {
              const normalizedQuantity = Number(item.quantity) || 0;
              if (normalizedQuantity <= 0) {
                continue;
              }

              const product = await Product.findById(item.product).session(session);
              if (!product) {
                throw new Error(`Product not found for received item: ${item.product}`);
              }
              const toBranchStock = product.stockByBranch.find(
                stock => stock.branch.toString() === transfer.toBranch.toString()
              );

              if (toBranchStock) {
                // Update existing stock
                await Product.updateOne(
                  {
                    _id: item.product,
                    'stockByBranch.branch': transfer.toBranch
                  },
                  {
                    $inc: { 'stockByBranch.$.quantity': normalizedQuantity },
                    $set: { 'stockByBranch.$.lastUpdated': new Date() }
                  },
                  { session }
                );
              } else {
                // Add new branch stock
                await Product.updateOne(
                  { _id: item.product },
                  {
                    $push: {
                      stockByBranch: {
                        branch: transfer.toBranch,
                        quantity: normalizedQuantity,
                        minLevel: 0,
                        maxLevel: 100,
                        lastUpdated: new Date()
                      }
                    }
                  },
                  { session }
                );
              }
            }
            break;

          case 'cancelled':
            transfer.cancelledAt = new Date();
            transfer.cancelledBy = req.user.userId;

            // If was shipped, restore stock to source branch
            if (previousStatus === 'shipped') {
              for (const item of transfer.items) {
                const quantity = Number(item.quantity) || 0;
                if (quantity <= 0) {
                  continue;
                }

                await Product.updateOne(
                  {
                    _id: item.product,
                    'stockByBranch.branch': transfer.fromBranch
                  },
                  {
                    $inc: { 'stockByBranch.$.quantity': quantity },
                    $set: { 'stockByBranch.$.lastUpdated': new Date() }
                  },
                  { session }
                );
              }
            }
            break;
          }

          await transfer.save({ session });
        });

        // Populate the response
        const updatedTransfer = await Transfer.findById(id)
          .populate('fromBranch', 'name code')
          .populate('toBranch', 'name code')
          .populate('createdBy', 'firstName lastName')
          .populate('approvedBy', 'firstName lastName')
          .populate('receivedBy', 'firstName lastName');

        return ResponseUtils.success(
          res,
          updatedTransfer,
          `Transfer ${status} successfully`
        );

      } finally {
        await session.endSession();
      }

    } catch (error) {
      console.error('Update transfer status error:', error);
      return ResponseUtils.error(res, 'Failed to update transfer status');
    }
  }

  /**
   * Get stock transfers with filtering and pagination
   */
  static async getTransfers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        fromBranch,
        toBranch,
        status,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const resolvedBranchIds = req.resolvedBranchIds || [];
      const hasGlobalAccess = hasCrossBranchAccess(req.user?.role);
      const andConditions = [];

      if (!hasGlobalAccess) {
        const userBranchId = getUserBranchId(req.user);
        if (!userBranchId) {
          return ResponseUtils.forbidden(res, 'Branch assignment required to view transfers');
        }

        andConditions.push({
          $or: [
            { fromBranch: userBranchId },
            { toBranch: userBranchId }
          ]
        });
      } else if (resolvedBranchIds.length > 0) {
        andConditions.push({
          $or: [
            { fromBranch: { $in: resolvedBranchIds } },
            { toBranch: { $in: resolvedBranchIds } }
          ]
        });
      }

      if (fromBranch && ValidationUtils.isValidObjectId(fromBranch)) {
        andConditions.push({ fromBranch });
      }

      if (toBranch && ValidationUtils.isValidObjectId(toBranch)) {
        andConditions.push({ toBranch });
      }

      if (status) {
        andConditions.push({ status });
      }

      if (startDate || endDate) {
        const dateRange = {};
        if (startDate) {
          dateRange.$gte = new Date(startDate);
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          dateRange.$lte = endOfDay;
        }

        andConditions.push({ createdAt: dateRange });
      }

      if (search) {
        andConditions.push({
          $or: [
            { transferNumber: { $regex: search, $options: 'i' } },
            { 'items.name': { $regex: search, $options: 'i' } },
            { 'items.sku': { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
          ]
        });
      }

      const filter = andConditions.length > 0 ? { $and: andConditions } : {};

      const { page: pageNumber, limit: pageSize } = ValidationUtils.validatePagination({ page, limit });
      const skip = (pageNumber - 1) * pageSize;

      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [transfers, total] = await Promise.all([
        Transfer.find(filter)
          .populate('fromBranch', 'name code')
          .populate('toBranch', 'name code')
          .populate('items.product', 'name sku')
          .populate('createdBy', 'firstName lastName')
          .populate('approvedBy', 'firstName lastName')
          .populate('receivedBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(pageSize),
        Transfer.countDocuments(filter)
      ]);

      return ResponseUtils.paginated(res, transfers, {
        page: pageNumber,
        limit: pageSize,
        total
      }, 'Transfers retrieved successfully');
    } catch (error) {
      console.error('Get transfers error:', error);
      return ResponseUtils.error(res, 'Failed to fetch stock transfers');
    }
  }

  /**
   * Get inventory summary by branch
   */
  static async getInventorySummary(req, res) {
    try {
      const resolvedBranchIds = req.resolvedBranchIds || [];
      const pipeline = [
        { $match: { isActive: true } },
        { $unwind: '$stockByBranch' }
      ];

      if (resolvedBranchIds.length > 0) {
        pipeline.push({
          $match: {
            'stockByBranch.branch': { $in: resolvedBranchIds.map((id) => new mongoose.Types.ObjectId(id)) }
          }
        });
      } else if (!hasCrossBranchAccess(req.user?.role)) {
        const userBranchId = getUserBranchId(req.user);
        if (!userBranchId) {
          return ResponseUtils.forbidden(res, 'Branch assignment required to view inventory summary');
        }

        pipeline.push({
          $match: {
            'stockByBranch.branch': new mongoose.Types.ObjectId(userBranchId)
          }
        });
      }

      pipeline.push(
        {
          $lookup: {
            from: 'branches',
            localField: 'stockByBranch.branch',
            foreignField: '_id',
            as: 'branchInfo'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $group: {
            _id: {
              branch: '$stockByBranch.branch',
              category: '$category'
            },
            branchName: { $first: { $arrayElemAt: ['$branchInfo.name', 0] } },
            categoryName: { $first: { $arrayElemAt: ['$categoryInfo.name', 0] } },
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stockByBranch.quantity' },
            lowStockItems: {
              $sum: {
                $cond: [
                  { $lt: ['$stockByBranch.quantity', '$stockByBranch.minLevel'] },
                  1,
                  0
                ]
              }
            },
            outOfStockItems: {
              $sum: {
                $cond: [
                  { $eq: ['$stockByBranch.quantity', 0] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.branch',
            branchName: { $first: '$branchName' },
            categories: {
              $push: {
                category: '$_id.category',
                categoryName: '$categoryName',
                totalProducts: '$totalProducts',
                totalStock: '$totalStock',
                lowStockItems: '$lowStockItems',
                outOfStockItems: '$outOfStockItems'
              }
            },
            totalProducts: { $sum: '$totalProducts' },
            totalStock: { $sum: '$totalStock' },
            totalLowStockItems: { $sum: '$lowStockItems' },
            totalOutOfStockItems: { $sum: '$outOfStockItems' }
          }
        }
      );

      const summary = await Product.aggregate(pipeline);

      return ResponseUtils.success(res, summary, 'Inventory summary retrieved successfully');

    } catch (error) {
      console.error('Get inventory summary error:', error);
      return ResponseUtils.error(res, 'Failed to get inventory summary');
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build base filter
      const filter = {
        isActive: true,
        stockByBranch: { $exists: true, $ne: [] }
      };

      // Add category filter if specified
      if (category) {
        filter.category = category;
      }

      const resolvedBranchIds = req.resolvedBranchIds || [];
      const hasGlobalAccess = hasCrossBranchAccess(req.user?.role);
      const branchFilters = resolvedBranchIds.map(String);

      if (!hasGlobalAccess && branchFilters.length === 0) {
        const userBranchId = getUserBranchId(req.user);
        if (!userBranchId) {
          return ResponseUtils.forbidden(res, 'Branch assignment required to view low stock items');
        }

        branchFilters.push(userBranchId.toString());
      }

      // Get all active products
      const query = Product.find(filter)
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('unit', 'name symbol')
        .populate('supplier', 'name')
        .populate('stockByBranch.branch', 'name code')
        .lean();

      const allProducts = await query;

      // Filter products with low stock in any branch (or specific branch)
      const lowStockItems = [];

      for (const product of allProducts) {
        for (const stock of product.stockByBranch) {
          // Check if this branch should be included
          const branchId = stock.branch?._id ? stock.branch._id.toString() : stock.branch?.toString();
          if (branchFilters.length > 0 && (!branchId || !branchFilters.includes(branchId))) {
            continue;
          }

          // Check if stock is below reorder level
          if (stock.quantity <= stock.reorderLevel) {
            lowStockItems.push({
              _id: product._id,
              name: product.name,
              sku: product.sku,
              category: product.category,
              brand: product.brand,
              unit: product.unit,
              supplier: product.supplier,
              stockQuantity: stock.quantity,
              reorderLevel: stock.reorderLevel,
              maxStockLevel: stock.maxStockLevel,
              branch: stock.branch,
              costPrice: product.pricing?.costPrice || 0,
              sellingPrice: product.pricing?.sellingPrice || 0,
              stockStatus: 'low',
              reorderQuantity: Math.max((stock.maxStockLevel || stock.reorderLevel * 3) - stock.quantity, 0),
              stockValue: stock.quantity * (product.pricing?.costPrice || 0),
              urgency: stock.quantity === 0 ? 'critical' :
                stock.quantity <= (stock.reorderLevel * 0.5) ? 'high' : 'medium'
            });
          }
        }
      }

      // Sort the results
      const direction = sortOrder === 'desc' ? -1 : 1;
      lowStockItems.sort((a, b) => {
        const aVal = a?.[sortBy];
        const bVal = b?.[sortBy];

        if (aVal === bVal) {
          return 0;
        }

        if (aVal === undefined || aVal === null) {
          return 1 * direction;
        }

        if (bVal === undefined || bVal === null) {
          return -1 * direction;
        }

        return aVal > bVal ? direction : -direction;
      });

      // Paginate
      const { page: pageNumber, limit: pageSize } = ValidationUtils.validatePagination({ page, limit });
      const total = lowStockItems.length;
      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedItems = lowStockItems.slice(startIndex, startIndex + pageSize);

      const responsePayload = {
        products: paginatedItems,
        summary: {
          totalLowStockItems: total,
          criticalItems: lowStockItems.filter((item) => item.urgency === 'critical').length,
          highUrgencyItems: lowStockItems.filter((item) => item.urgency === 'high').length
        }
      };

      return ResponseUtils.paginated(res, responsePayload, {
        page: pageNumber,
        limit: pageSize,
        total
      }, 'Low stock items retrieved successfully');

    } catch (error) {
      console.error('Error getting low stock items:', error);
      return ResponseUtils.error(res, 'Failed to get low stock items');
    }
  }
}

/**
 * Helper function to generate adjustment number
 */
async function generateAdjustmentNumber(branchCode) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const prefix = `ADJ-${branchCode}-${year}${month}${day}`;

  const lastAdjustment = await Adjustment.findOne({
    adjustmentNumber: { $regex: `^${prefix}` }
  }).sort({ adjustmentNumber: -1 });

  let nextNumber = 1;
  if (lastAdjustment) {
    const lastNumber = lastAdjustment.adjustmentNumber.match(/(\d+)$/);
    if (lastNumber) {
      nextNumber = parseInt(lastNumber[1]) + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Helper function to generate transfer number
 */
async function generateTransferNumber(fromBranchCode, toBranchCode) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const prefix = `TXF-${fromBranchCode}${toBranchCode}-${year}${month}`;

  const lastTransfer = await Transfer.findOne({
    transferNumber: { $regex: `^${prefix}` }
  }).sort({ transferNumber: -1 });

  let nextNumber = 1;
  if (lastTransfer) {
    const lastNumber = lastTransfer.transferNumber.match(/(\d+)$/);
    if (lastNumber) {
      nextNumber = parseInt(lastNumber[1]) + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

module.exports = InventoryController;
