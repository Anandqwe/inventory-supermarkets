const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');

/**
 * Purchase Order Controller
 * Handles purchase orders, supplier management, and procurement workflows
 */
class PurchaseController {
  /**
   * Create new purchase order
   */
  static async createPurchaseOrder(req, res) {
    try {
      console.log('📦 Create Purchase Order - Request Body:', JSON.stringify(req.body, null, 2));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        supplier: supplierId,
        branch: requestedBranchId,
        items,
        expectedDeliveryDate,
        terms,
        notes,
        discount = { type: 'none', value: 0 },
        tax = { rate: 0, amount: 0 }
      } = req.body;

      // Validate required fields
      if (!supplierId) {
        console.log('❌ Missing supplier ID');
        return res.status(400).json({
          success: false,
          message: 'Supplier is required'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('❌ Invalid items:', items);
        return res.status(400).json({
          success: false,
          message: 'At least one item is required'
        });
      }

      // Validate supplier
      console.log('🔍 Looking for supplier:', supplierId);
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        console.log('❌ Supplier not found');
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier'
        });
      }
      console.log('✅ Supplier found:', supplier.name);

      // Validate branch - handle both string ID and populated object
      let branchId = requestedBranchId || (req.user.branch?._id || req.user.branch);

      // If no branch in JWT, fetch user's branch from database
      if (!branchId) {
        console.log('⚠️ No branch in JWT, fetching from database...');
        const User = require('../models/User');
        const user = await User.findById(req.user.userId).select('branch role');
        if (user && user.branch) {
          branchId = user.branch;
          console.log('✅ Branch fetched from user:', branchId);
        } else if (user && (user.role === 'Admin' || user.role === 'Regional Manager')) {
          // Admin and Regional Manager don't have assigned branches
          // Use the first available branch as default
          console.log('⚠️ Admin/Regional Manager without branch, using default branch...');
          const defaultBranch = await Branch.findOne();
          if (defaultBranch) {
            branchId = defaultBranch._id;
            console.log('✅ Using default branch:', defaultBranch.name);
          }
        }
      }

      console.log('🔍 Looking for branch:', branchId);
      console.log('👤 User role:', req.user.role);

      const branch = await Branch.findById(branchId);
      if (!branch) {
        console.log('❌ Branch not found');
        return res.status(400).json({
          success: false,
          message: 'Invalid branch - Please select a branch for this purchase order'
        });
      }
      console.log('✅ Branch found:', branch.name);

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        const userBranchId = req.user.branch._id || req.user.branch;
        if (userBranchId.toString() !== branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Can only create purchase orders for your assigned branch'
          });
        }
      }

      // Validate and process purchase items
      const processedItems = [];
      let subtotal = 0;

      for (const item of items) {
        // Validate product
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${item.product}`
          });
        }

        // Calculate line total with tax
        const unitPrice = item.unitCost;
        const totalPrice = unitPrice * item.quantity;
        const taxRate = item.tax?.rate || 18; // Default 18% GST
        const taxAmount = (totalPrice * taxRate) / 100;

        const processedItem = {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit?.symbol || 'pcs',
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          discount: {
            amount: item.discount?.amount || 0,
            percentage: item.discount?.percentage || 0
          },
          tax: {
            rate: taxRate,
            amount: taxAmount
          }
        };

        processedItems.push(processedItem);
        subtotal += totalPrice;
      }

      // Calculate purchase totals
      let totalDiscount = 0;
      if (discount.type === 'percentage') {
        totalDiscount = (subtotal * discount.value) / 100;
      } else if (discount.type === 'amount') {
        totalDiscount = Math.min(discount.value, subtotal);
      }

      const discountedSubtotal = subtotal - totalDiscount;
      const totalTax = processedItems.reduce((sum, item) => sum + item.tax.amount, 0);
      const grandTotal = discountedSubtotal + totalTax;

      // Generate purchase number
      const purchaseNumber = await generatePurchaseOrderNumber(branch.code);

      // Create purchase order
      const purchase = new Purchase({
        purchaseNumber,
        supplier: supplier._id,
        branch: branch._id,
        items: processedItems,
        totals: {
          subtotal,
          totalDiscount,
          totalTax,
          shippingCharges: 0,
          totalAmount: grandTotal
        },
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        payment: {
          method: 'credit', // Default to credit for purchase orders
          status: 'pending'
        },
        notes,
        createdBy: req.user.userId
      });

      await purchase.save();
      console.log('✅ Purchase order created:', purchaseNumber);

      // Populate the response
      const populatedPurchase = await Purchase.findById(purchase._id)
        .populate('supplier', 'name code contact')
        .populate('branch', 'name code')
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Purchase order created successfully',
        data: populatedPurchase
      });

    } catch (error) {
      console.error('Create purchase order error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get purchase orders with filtering and pagination
   */
  static async getPurchaseOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        supplier,
        branch,
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
        filter.branch = req.user.branch._id || req.user.branch;
      } else if (branch) {
        filter.branch = branch;
      }

      // Supplier filter
      if (supplier) {
        filter.supplier = supplier;
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
        const supplierSearch = await Supplier.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');

        filter.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } },
          { 'items.sku': { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { supplier: { $in: supplierSearch.map(s => s._id) } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [purchases, total] = await Promise.all([
        Purchase.find(filter)
          .populate('supplier', 'name code contact')
          .populate('branch', 'name code')
          .populate('items.product', 'name sku')
          .populate('createdBy', 'firstName lastName')
          .populate('receivedBy', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Purchase.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Purchase orders retrieved successfully',
        data: purchases,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get purchase orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(req, res) {
    try {
      const { id } = req.params;

      const purchase = await Purchase.findById(id)
        .populate('supplier', 'name code contact address')
        .populate('branch', 'name code address')
        .populate('createdBy', 'firstName lastName email')
        .populate('receivedBy', 'firstName lastName email');

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (purchase.branch._id.toString() !== req.user.branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Purchase order not from your branch'
          });
        }
      }

      res.json({
        success: true,
        message: 'Purchase order retrieved successfully',
        data: purchase
      });

    } catch (error) {
      console.error('Get purchase order by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update purchase order status
   */
  static async updatePurchaseOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, approverComments } = req.body;

      const purchase = await Purchase.findById(id);
      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      // Check permissions for approval/rejection
      if ((status === 'approved' || status === 'rejected') && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Only managers and admins can approve/reject purchase orders'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (purchase.branch.toString() !== req.user.branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Purchase order not from your branch'
          });
        }
      }

      // Validate status transition
      const validTransitions = {
        'pending': ['approved', 'rejected', 'cancelled'],
        'approved': ['ordered', 'cancelled'],
        'ordered': ['partially_received', 'completed', 'cancelled'],
        'partially_received': ['completed', 'cancelled'],
        'completed': [],
        'rejected': [],
        'cancelled': []
      };

      if (!validTransitions[purchase.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${purchase.status} to ${status}`
        });
      }

      // Update purchase order
      purchase.status = status;
      purchase.notes = notes || purchase.notes;

      // Handle specific status updates
      switch (status) {
      case 'approved':
        purchase.approvedAt = new Date();
        purchase.approvedBy = req.user.userId;
        purchase.approverComments = approverComments;
        break;
      case 'rejected':
        purchase.rejectedAt = new Date();
        purchase.rejectedBy = req.user.userId;
        purchase.approverComments = approverComments;
        break;
      case 'ordered':
        purchase.orderedAt = new Date();
        purchase.orderedBy = req.user.userId;
        break;
      case 'cancelled':
        purchase.cancelledAt = new Date();
        purchase.cancelledBy = req.user.userId;
        break;
      }

      await purchase.save();

      // Populate the response
      const updatedPurchase = await Purchase.findById(id)
        .populate('supplier', 'name code')
        .populate('branch', 'name code')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('rejectedBy', 'firstName lastName')
        .populate('orderedBy', 'firstName lastName')
        .populate('cancelledBy', 'firstName lastName');

      res.json({
        success: true,
        message: `Purchase order ${status} successfully`,
        data: updatedPurchase
      });

    } catch (error) {
      console.error('Update purchase order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Receive purchase order items
   */
  static async receivePurchaseOrder(req, res) {
    try {
      const { id } = req.params;
      const { receivedItems, notes } = req.body;

      const purchase = await Purchase.findById(id);
      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      // Check if purchase order is in valid status for receiving
      if (!['ordered', 'partially_received'].includes(purchase.status)) {
        return res.status(400).json({
          success: false,
          message: 'Purchase order must be in ordered or partially received status'
        });
      }

      // Check branch access for non-admin users
      if (req.user.role !== 'admin' && req.user.branch) {
        if (purchase.branch.toString() !== req.user.branch._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - Can only receive items for your assigned branch'
          });
        }
      }

      // Start transaction
      const session = await Purchase.db.startSession();

      try {
        await session.withTransaction(async () => {
          let allItemsReceived = true;

          // Update received quantities and stock
          for (const receivedItem of receivedItems) {
            const purchaseItem = purchase.items.find(
              item => item.product.toString() === receivedItem.product
            );

            if (!purchaseItem) {
              throw new Error(`Product not found in purchase order: ${receivedItem.product}`);
            }

            if (receivedItem.quantity > purchaseItem.pendingQuantity) {
              throw new Error(`Cannot receive more than pending quantity for ${purchaseItem.name}`);
            }

            // Update purchase item quantities
            purchaseItem.receivedQuantity += receivedItem.quantity;
            purchaseItem.pendingQuantity -= receivedItem.quantity;

            if (purchaseItem.pendingQuantity > 0) {
              allItemsReceived = false;
            }

            // Update product stock in branch
            const product = await Product.findById(receivedItem.product);
            const branchStock = product.stockByBranch.find(
              stock => stock.branch.toString() === purchase.branch.toString()
            );

            if (branchStock) {
              // Update existing stock
              await Product.updateOne(
                {
                  _id: receivedItem.product,
                  'stockByBranch.branch': purchase.branch
                },
                {
                  $inc: { 'stockByBranch.$.quantity': receivedItem.quantity },
                  $set: { 'stockByBranch.$.lastUpdated': new Date() }
                },
                { session }
              );
            } else {
              // Add new branch stock
              await Product.updateOne(
                { _id: receivedItem.product },
                {
                  $push: {
                    stockByBranch: {
                      branch: purchase.branch,
                      quantity: receivedItem.quantity,
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

          // Update purchase order status
          purchase.status = allItemsReceived ? 'completed' : 'partially_received';
          purchase.receivedAt = new Date();
          purchase.receivedBy = req.user.userId;
          purchase.receiverNotes = notes;

          if (allItemsReceived) {
            purchase.completedAt = new Date();
          }

          await purchase.save({ session });
        });

        // Populate the response
        const updatedPurchase = await Purchase.findById(id)
          .populate('supplier', 'name code')
          .populate('branch', 'name code')
          .populate('createdBy', 'firstName lastName')
          .populate('receivedBy', 'firstName lastName');

        res.json({
          success: true,
          message: 'Purchase order received successfully',
          data: updatedPurchase
        });

      } catch (error) {
        await session.endSession();
        throw error;
      } finally {
        await session.endSession();
      }

    } catch (error) {
      console.error('Receive purchase order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Generate reorder suggestions based on low stock
   */
  static async getReorderSuggestions(req, res) {
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
          $match: {
            $expr: {
              $lt: ['$stockByBranch.quantity', '$stockByBranch.minLevel']
            }
          }
        },
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
            from: 'suppliers',
            localField: 'supplier',
            foreignField: '_id',
            as: 'supplierInfo'
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
          $project: {
            name: 1,
            sku: 1,
            branch: {
              _id: '$stockByBranch.branch',
              name: { $arrayElemAt: ['$branchInfo.name', 0] },
              code: { $arrayElemAt: ['$branchInfo.code', 0] }
            },
            supplier: {
              _id: '$supplier',
              name: { $arrayElemAt: ['$supplierInfo.name', 0] },
              code: { $arrayElemAt: ['$supplierInfo.code', 0] }
            },
            category: {
              name: { $arrayElemAt: ['$categoryInfo.name', 0] }
            },
            currentStock: '$stockByBranch.quantity',
            minLevel: '$stockByBranch.minLevel',
            maxLevel: '$stockByBranch.maxLevel',
            suggestedQuantity: {
              $subtract: ['$stockByBranch.maxLevel', '$stockByBranch.quantity']
            },
            lastUpdated: '$stockByBranch.lastUpdated'
          }
        },
        {
          $group: {
            _id: '$supplier._id',
            supplierName: { $first: '$supplier.name' },
            supplierCode: { $first: '$supplier.code' },
            products: {
              $push: {
                _id: '$_id',
                name: '$name',
                sku: '$sku',
                branch: '$branch',
                category: '$category',
                currentStock: '$currentStock',
                minLevel: '$minLevel',
                maxLevel: '$maxLevel',
                suggestedQuantity: '$suggestedQuantity',
                lastUpdated: '$lastUpdated'
              }
            },
            totalProducts: { $sum: 1 }
          }
        },
        { $sort: { supplierName: 1 } }
      );

      const suggestions = await Product.aggregate(pipeline);

      res.json({
        success: true,
        message: 'Reorder suggestions retrieved successfully',
        data: suggestions
      });

    } catch (error) {
      console.error('Get reorder suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get purchase analytics
   */
  static async getPurchaseAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        branch,
        supplier,
        groupBy = 'month'
      } = req.query;

      // Build filter
      const filter = {};

      // Branch filter for RBAC
      if (req.user.role !== 'admin' && req.user.branch) {
        filter.branch = req.user.branch._id;
      } else if (branch) {
        filter.branch = branch;
      }

      // Supplier filter
      if (supplier) {
        filter.supplier = supplier;
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

      // Only completed purchases for analytics
      filter.status = 'completed';

      // Group by configuration
      let dateGroupFormat;
      switch (groupBy) {
      case 'day':
        dateGroupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } };
        break;
      case 'week':
        dateGroupFormat = { $dateToString: { format: '%Y-W%V', date: '$completedAt' } };
        break;
      case 'month':
        dateGroupFormat = { $dateToString: { format: '%Y-%m', date: '$completedAt' } };
        break;
      case 'quarter':
        dateGroupFormat = { $dateToString: { format: '%Y-Q%q', date: '$completedAt' } };
        break;
      default:
        dateGroupFormat = { $dateToString: { format: '%Y-%m', date: '$completedAt' } };
      }

      // Analytics aggregation
      const analytics = await Purchase.aggregate([
        { $match: filter },
        {
          $group: {
            _id: dateGroupFormat,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$total' },
            totalDiscount: { $sum: '$discountAmount' },
            averageOrderValue: { $avg: '$total' },
            totalItemsOrdered: { $sum: { $sum: '$items.quantity' } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Summary statistics
      const summary = await Purchase.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$total' },
            totalDiscount: { $sum: '$discountAmount' },
            averageOrderValue: { $avg: '$total' },
            totalItemsOrdered: { $sum: { $sum: '$items.quantity' } }
          }
        }
      ]);

      // Top suppliers
      const topSuppliers = await Purchase.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$supplier',
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$total' }
          }
        },
        {
          $lookup: {
            from: 'suppliers',
            localField: '_id',
            foreignField: '_id',
            as: 'supplierInfo'
          }
        },
        {
          $project: {
            supplierName: { $arrayElemAt: ['$supplierInfo.name', 0] },
            supplierCode: { $arrayElemAt: ['$supplierInfo.code', 0] },
            totalOrders: 1,
            totalValue: 1
          }
        },
        { $sort: { totalValue: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        message: 'Purchase analytics retrieved successfully',
        data: {
          analytics,
          summary: summary[0] || {
            totalOrders: 0,
            totalValue: 0,
            totalDiscount: 0,
            averageOrderValue: 0,
            totalItemsOrdered: 0
          },
          topSuppliers
        }
      });

    } catch (error) {
      console.error('Get purchase analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

/**
 * Helper function to generate purchase order number
 */
async function generatePurchaseOrderNumber(branchCode) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const prefix = `PO-${branchCode}-${year}${month}`;

  // Find the last purchase order with this prefix
  const lastPurchase = await Purchase.findOne({
    purchaseNumber: { $regex: `^${prefix}` }
  }).sort({ purchaseNumber: -1 });

  let nextNumber = 1;
  if (lastPurchase) {
    const lastNumber = lastPurchase.purchaseNumber.match(/(\d+)$/);
    if (lastNumber) {
      nextNumber = parseInt(lastNumber[1]) + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

module.exports = PurchaseController;
