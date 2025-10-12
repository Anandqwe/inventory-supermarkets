const Product = require('../models/Product');
const Adjustment = require('../models/Adjustment');
const Transfer = require('../models/Transfer');
const Purchase = require('../models/Purchase');
const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');

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
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        branch: branchId,
        items, // array of { product, currentQuantity, adjustedQuantity, unit, sku, productName }
        type, // 'increase' | 'decrease' | 'correction'
        reason,
        notes
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
            message: 'Access denied - Can only adjust inventory for your assigned branch'
          });
        }
      }

      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'No items provided for adjustment' });
      }

      // Generate adjustment number
      const adjustmentNumber = await generateAdjustmentNumber(branch.code);

      // Start transaction
      const session = await Adjustment.db.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Build items array and update product stocks
          const adjItems = [];
          for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
              throw new Error(`Product not found: ${item.product}`);
            }

            const branchStock = product.stockByBranch.find(
              stock => stock.branch.toString() === branch._id.toString()
            );

            const currentQuantity = branchStock ? branchStock.quantity : 0;
            const adjustedQuantity = item.adjustedQuantity;
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

            // Apply stock update
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

          // Create adjustment record
          const adjustment = new Adjustment({
            adjustmentNumber,
            branch: branch._id,
            items: adjItems,
            type,
            reason,
            notes,
            createdBy: req.user.userId
          });

          await adjustment.save({ session });
        });

        // Fetch complete adjustment data
        const completeAdjustment = await Adjustment.findById(adjustment._id)
          .populate('branch', 'name code')
          .populate('items.product', 'name sku')
          .populate('createdBy', 'firstName lastName')
          .populate('approvedBy', 'firstName lastName');

        res.status(201).json({
          success: true,
          message: 'Stock adjustment created successfully',
          data: completeAdjustment
        });

      } catch (error) {
        await session.endSession();
        throw error;
      } finally {
        await session.endSession();
      }

    } catch (error) {
      console.error('Create adjustment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
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
        branch,
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

      // Build filter
      const filter = {};

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        filter.branch = req.user.branch._id || req.user.branch;
      } else if (branch) {
        filter.branch = branch;
      }

      // Product filter
      if (product) {
        filter.product = product;
      }

      // Type filter
      if (type) {
        filter.type = type;
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

      // Reason filter
      if (reason) {
        filter.reason = reason;
      }

      // Adjusted by filter
      if (adjustedBy) {
        filter.adjustedBy = adjustedBy;
      }

      // Search filter
      if (search) {
        const productSearch = await Product.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');

        filter.$or = [
          { adjustmentNumber: { $regex: search, $options: 'i' } },
          { reason: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { product: { $in: productSearch.map(p => p._id) } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [adjustments, total] = await Promise.all([
        Adjustment.find(filter)
          .populate('branch', 'name code')
          .populate('items.product', 'name sku')
          .populate('createdBy', 'firstName lastName')
          .populate('approvedBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Adjustment.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Stock adjustments retrieved successfully',
        data: adjustments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get adjustments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Create stock transfer between branches
   */
  static async createTransfer(req, res) {
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
        fromBranch: fromBranchId,
        toBranch: toBranchId,
        items,
        notes,
        expectedDeliveryDate
      } = req.body;

      // Validate branches
      const [fromBranch, toBranch] = await Promise.all([
        Branch.findById(fromBranchId),
        Branch.findById(toBranchId)
      ]);

      if (!fromBranch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid source branch'
        });
      }

      if (!toBranch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid destination branch'
        });
      }

      if (fromBranchId === toBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Source and destination branches cannot be the same'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (req.user.branch._id.toString() !== fromBranchId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Can only create transfers from your assigned branch'
          });
        }
      }

      // Validate and process transfer items
      const processedItems = [];
      
      for (const item of items) {
        // Validate product
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${item.product}`
          });
        }

        // Check stock availability in source branch
        const fromBranchStock = product.stockByBranch.find(
          stock => stock.branch.toString() === fromBranchId
        );

        if (!fromBranchStock || fromBranchStock.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name} in source branch. Available: ${fromBranchStock?.quantity || 0}`
          });
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

      // Create transfer
      const transfer = new Transfer({
        transferNumber,
        fromBranch: fromBranch._id,
        toBranch: toBranch._id,
        items: processedItems,
        totalItems: processedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: processedItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
        status: 'pending',
        notes,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        initiatedBy: req.user.userId
      });

      await transfer.save();

      // Populate the response
  const populatedTransfer = await Transfer.findById(transfer._id)
  .populate('fromBranch', 'name code')
  .populate('toBranch', 'name code')
  .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Transfer created successfully',
        data: populatedTransfer
      });

    } catch (error) {
      console.error('Create transfer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update transfer status (ship, receive, cancel)
   */
  static async updateTransferStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, receivedItems } = req.body;

      const transfer = await Transfer.findById(id);
      if (!transfer) {
        return res.status(404).json({
          success: false,
          message: 'Transfer not found'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        const allowedBranches = [transfer.fromBranch.toString(), transfer.toBranch.toString()];
        if (!allowedBranches.includes(req.user.branch._id.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Transfer not related to your branch'
          });
        }
      }

      // Validate status transition
      const validTransitions = {
        'pending': ['shipped', 'cancelled'],
        'shipped': ['received', 'cancelled'],
        'received': [],
        'cancelled': []
      };

      if (!validTransitions[transfer.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${transfer.status} to ${status}`
        });
      }

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
                await Product.updateOne(
                  {
                    _id: item.product,
                    'stockByBranch.branch': transfer.fromBranch
                  },
                  {
                    $inc: { 'stockByBranch.$.quantity': -item.quantity },
                    $set: { 'stockByBranch.$.lastUpdated': new Date() }
                  },
                  { session }
                );
              }
              break;

            case 'received':
              transfer.receivedAt = new Date();
              transfer.receivedBy = req.user.userId;
              transfer.receivedItems = receivedItems || transfer.items;

              // Add stock to destination branch
              for (const item of transfer.receivedItems) {
                const product = await Product.findById(item.product);
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
                      $inc: { 'stockByBranch.$.quantity': item.quantity },
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
                          quantity: item.quantity,
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
              if (transfer.status === 'shipped') {
                for (const item of transfer.items) {
                  await Product.updateOne(
                    {
                      _id: item.product,
                      'stockByBranch.branch': transfer.fromBranch
                    },
                    {
                      $inc: { 'stockByBranch.$.quantity': item.quantity },
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

        res.json({
          success: true,
          message: `Transfer ${status} successfully`,
          data: updatedTransfer
        });

      } catch (error) {
        await session.endSession();
        throw error;
      } finally {
        await session.endSession();
      }

    } catch (error) {
      console.error('Update transfer status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
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

      // Build filter
      const filter = {};

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        const branchId = req.user.branch._id || req.user.branch;
        filter.$or = [
          { fromBranch: branchId },
          { toBranch: branchId }
        ];
      } else {
        if (fromBranch) filter.fromBranch = fromBranch;
        if (toBranch) filter.toBranch = toBranch;
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

      // Search filter
      if (search) {
        filter.$or = [
          { transferNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } },
          { 'items.sku': { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
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
          .limit(parseInt(limit)),
        Transfer.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Transfers retrieved successfully',
        data: transfers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get transfers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get inventory summary by branch
   */
  static async getInventorySummary(req, res) {
    try {
      const { branch } = req.query;

      // Build filter
      const filter = { isActive: true };

      // Branch filter for RBAC
      let branchFilter;
      if (req.user.role !== 'admin' && req.user.branch) {
        branchFilter = req.user.branch._id;
      } else if (branch) {
        branchFilter = branch;
      }

      const pipeline = [
        { $match: filter },
        { $unwind: '$stockByBranch' }
      ];

      if (branchFilter) {
        pipeline.push({ $match: { 'stockByBranch.branch': branchFilter } });
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

      res.json({
        success: true,
        message: 'Inventory summary retrieved successfully',
        data: summary
      });

    } catch (error) {
      console.error('Get inventory summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
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
        branch,
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

      // Branch filter for RBAC
      let branchFilter = null;
      if (req.user.role !== 'admin' && req.user.branch) {
        branchFilter = req.user.branch._id;
      } else if (branch) {
        branchFilter = branch;
      }

      // Get all active products
      let query = Product.find(filter)
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
          if (branchFilter && stock.branch._id.toString() !== branchFilter.toString()) {
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
      lowStockItems.sort((a, b) => {
        if (sortOrder === 'desc') {
          return b[sortBy] > a[sortBy] ? 1 : -1;
        }
        return a[sortBy] > b[sortBy] ? 1 : -1;
      });

      // Paginate
      const total = lowStockItems.length;
      const startIndex = (page - 1) * limit;
      const paginatedItems = lowStockItems.slice(startIndex, startIndex + parseInt(limit));

      res.json({
        success: true,
        message: 'Low stock items retrieved successfully',
        data: {
          products: paginatedItems,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          },
          summary: {
            totalLowStockItems: total,
            criticalItems: lowStockItems.filter(item => item.urgency === 'critical').length,
            highUrgencyItems: lowStockItems.filter(item => item.urgency === 'high').length
          }
        }
      });

    } catch (error) {
      console.error('Error getting low stock items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock items',
        error: error.message
      });
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
