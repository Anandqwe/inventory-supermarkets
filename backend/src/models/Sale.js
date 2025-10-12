const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be positive']
  },
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: [0, 'Selling price cannot be negative']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  total: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'mobile', 'bank_transfer', 'check', 'credit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  reference: {
    type: String
  },
  receivedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true
  },
  items: [saleItemSchema],

  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String
  },
  customerPhone: {
    type: String
  },
  customerEmail: {
    type: String
  },
  customerAddress: {
    type: String
  },

  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'credit', 'multiple'],
    default: 'cash'
  },
  payments: [paymentSchema],
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  amountDue: {
    type: Number,
    default: 0
  },
  changeAmount: {
    type: Number,
    default: 0
  },

  // Status and Tracking
  status: {
    type: String,
    enum: ['draft', 'pending', 'completed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'completed',
    index: true
  },
  saleType: {
    type: String,
    enum: ['retail', 'wholesale', 'online', 'return'],
    default: 'retail'
  },

  // Refund Information
  refundedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundReason: {
    type: String
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundedAt: {
    type: Date
  },

  // Notes and References
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  internalNotes: {
    type: String,
    maxlength: [500, 'Internal notes cannot exceed 500 characters']
  },

  // Delivery Information
  deliveryInfo: {
    type: {
      type: String,
      enum: ['pickup', 'delivery', 'shipping']
    },
    address: String,
    scheduledDate: Date,
    deliveredDate: Date,
    trackingNumber: String
  },

  // Staff Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Audit Trail
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
saleSchema.index({ createdAt: -1 });
saleSchema.index({ branch: 1, createdAt: -1 });
saleSchema.index({ createdBy: 1, createdAt: -1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ customerPhone: 1 });
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ 'items.product': 1 });

// Virtuals
saleSchema.virtual('profit').get(function() {
  return this.items.reduce((profit, item) => {
    return profit + ((item.sellingPrice - item.costPrice) * item.quantity);
  }, 0);
});

saleSchema.virtual('profitMargin').get(function() {
  if (this.subtotal > 0) {
    return (this.profit / this.subtotal) * 100;
  }
  return 0;
});

saleSchema.virtual('isPaid').get(function() {
  return this.amountPaid >= this.total;
});

saleSchema.virtual('isPartiallyPaid').get(function() {
  return this.amountPaid > 0 && this.amountPaid < this.total;
});

// Generate sale number before saving
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.saleNumber) {
    const count = await this.constructor.countDocuments();
    this.saleNumber = `SALE-${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate amount due
  this.amountDue = Math.max(0, this.total - this.amountPaid);

  // Update updatedBy
  if (!this.isNew && this.isModified() && this.updatedBy) {
    this.updatedBy = this.updatedBy;
  }

  next();
});

// Methods
saleSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.amountPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (this.amountPaid >= this.total) {
    this.status = 'completed';
    this.changeAmount = this.amountPaid - this.total;
  }

  return this.save();
};

saleSchema.methods.processRefund = function(amount, reason, refundedBy) {
  if (amount > (this.total - this.refundedAmount)) {
    throw new Error('Refund amount cannot exceed sale total');
  }

  this.refundedAmount += amount;
  this.refundReason = reason;
  this.refundedBy = refundedBy;
  this.refundedAt = new Date();

  if (this.refundedAmount >= this.total) {
    this.status = 'refunded';
  } else if (this.refundedAmount > 0) {
    this.status = 'partially_refunded';
  }

  // Add to audit log
  this.auditLog.push({
    action: 'refund_processed',
    performedBy: refundedBy,
    details: {
      amount,
      reason,
      previousStatus: this.status
    }
  });

  return this.save();
};

saleSchema.methods.cancel = function(cancelledBy, reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed sale. Process a refund instead.');
  }

  this.status = 'cancelled';
  this.auditLog.push({
    action: 'sale_cancelled',
    performedBy: cancelledBy,
    details: { reason }
  });

  return this.save();
};

// Static methods
saleSchema.statics.getSalesReport = function(filters) {
  const pipeline = [];

  // Match stage
  const matchStage = { $match: {} };

  if (filters.startDate && filters.endDate) {
    matchStage.$match.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  if (filters.branch) {
    matchStage.$match.branch = mongoose.Types.ObjectId(filters.branch);
  }

  if (filters.status) {
    matchStage.$match.status = filters.status;
  }

  if (filters.paymentMethod) {
    matchStage.$match.paymentMethod = filters.paymentMethod;
  }

  pipeline.push(matchStage);

  // Group stage for aggregation
  pipeline.push({
    $group: {
      _id: null,
      totalSales: { $sum: 1 },
      totalRevenue: { $sum: '$total' },
      totalDiscounts: { $sum: '$discountAmount' },
      totalTax: { $sum: '$taxAmount' },
      averageOrderValue: { $avg: '$total' }
    }
  });

  return this.aggregate(pipeline);
};

saleSchema.statics.getTopProducts = function(filters = {}) {
  const pipeline = [];

  // Match stage
  const matchStage = { $match: { status: { $in: ['completed', 'partially_refunded'] } } };

  if (filters.startDate && filters.endDate) {
    matchStage.$match.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  if (filters.branch) {
    matchStage.$match.branch = mongoose.Types.ObjectId(filters.branch);
  }

  pipeline.push(matchStage);

  // Unwind items
  pipeline.push({ $unwind: '$items' });

  // Group by product
  pipeline.push({
    $group: {
      _id: '$items.product',
      productName: { $first: '$items.productName' },
      sku: { $first: '$items.sku' },
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$items.total' },
      salesCount: { $sum: 1 }
    }
  });

  // Sort by revenue
  pipeline.push({ $sort: { totalRevenue: -1 } });

  // Limit results
  pipeline.push({ $limit: filters.limit || 10 });

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Sale', saleSchema);
