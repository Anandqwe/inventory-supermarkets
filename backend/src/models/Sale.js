const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Denormalized product data for historical accuracy
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Quantity must be a positive number'
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v > 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  // Calculated fields
  lineTotal: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v > 0;
      },
      message: 'Line total must be a valid positive number'
    }
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%']
    }
  }
}, {
  _id: true
});

// Calculate line total before saving
saleItemSchema.pre('save', function(next) {
  const baseAmount = this.qty * this.price;
  const discountAmount = this.discount.amount || 0;
  const discountPercentage = this.discount.percentage || 0;
  
  let total = baseAmount - discountAmount;
  if (discountPercentage > 0) {
    total = total * (1 - discountPercentage / 100);
  }
  
  this.lineTotal = Math.round(total * 100) / 100; // Round to 2 decimal places
  next();
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  items: {
    type: [saleItemSchema],
    required: [true, 'Sale must have at least one item'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Sale must contain at least one item'
    }
  },
  totals: {
    subtotal: {
      type: Number,
      required: true,
      min: [0.01, 'Subtotal must be greater than 0']
    },
    tax: {
      rate: {
        type: Number,
        default: 0,
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100%']
      },
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Tax amount cannot be negative']
      }
    },
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Discount amount cannot be negative']
      },
      reason: String
    },
    grandTotal: {
      type: Number,
      required: true,
      min: [0.01, 'Grand total must be greater than 0']
    }
  },
  customer: {
    name: String,
    email: String,
    phone: String,
    loyaltyNumber: String
  },
  payment: {
    method: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'upi', 'netbanking', 'wallet'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    },
    transactionId: String,
    amountPaid: {
      type: Number,
      required: true,
      min: [0, 'Amount paid cannot be negative']
    },
    change: {
      type: Number,
      default: 0,
      min: [0, 'Change cannot be negative']
    }
  },
  cashier: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: String
  },
  status: {
    type: String,
    enum: ['completed', 'voided', 'returned', 'partially-returned'],
    default: 'completed'
  },
  notes: String,
  voidReason: String,
  returnDetails: {
    returnDate: Date,
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    returnedItems: [{
      productId: mongoose.Schema.Types.ObjectId,
      qty: Number,
      reason: String
    }],
    refundAmount: Number
  },
  // Metadata
  source: {
    type: String,
    enum: ['pos', 'online', 'mobile', 'manual'],
    default: 'pos'
  },
  deviceInfo: {
    deviceId: String,
    location: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
saleSchema.index({ saleNumber: 1 }, { unique: true });
saleSchema.index({ date: -1 }); // Most recent first
saleSchema.index({ 'cashier.id': 1 });
saleSchema.index({ 'payment.method': 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ createdAt: -1 });

// Compound indexes for common queries
saleSchema.index({ date: -1, status: 1 });
saleSchema.index({ 'cashier.id': 1, date: -1 });

// Virtual for total items count
saleSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});

// Virtual for formatted sale number
saleSchema.virtual('formattedSaleNumber').get(function() {
  return `INV-${this.saleNumber}`;
});

// Pre-save middleware to auto-generate sale number
saleSchema.pre('save', async function(next) {
  if (!this.saleNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last sale of the day
    const lastSale = await this.constructor.findOne({
      saleNumber: new RegExp(`^${dateStr}`)
    }).sort({ saleNumber: -1 });
    
    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.saleNumber = `${dateStr}${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate totals
saleSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.totals.subtotal = this.items.reduce((sum, item) => sum + item.lineTotal, 0);
  
  // Calculate tax
  if (this.totals.tax.rate > 0) {
    this.totals.tax.amount = (this.totals.subtotal * this.totals.tax.rate) / 100;
  }
  
  // Calculate grand total
  this.totals.grandTotal = this.totals.subtotal + this.totals.tax.amount - (this.totals.discount.amount || 0);
  
  // Round to 2 decimal places
  this.totals.subtotal = Math.round(this.totals.subtotal * 100) / 100;
  this.totals.tax.amount = Math.round(this.totals.tax.amount * 100) / 100;
  this.totals.grandTotal = Math.round(this.totals.grandTotal * 100) / 100;
  
  // Calculate change
  if (this.payment.amountPaid) {
    this.payment.change = Math.max(0, this.payment.amountPaid - this.totals.grandTotal);
    this.payment.change = Math.round(this.payment.change * 100) / 100;
  }
  
  next();
});

// Static method to get sales summary for a date range
saleSchema.statics.getSalesSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: { $in: ['completed', 'partially-returned'] }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$totals.grandTotal' },
        totalItems: { $sum: { $sum: '$items.qty' } },
        averageOrderValue: { $avg: '$totals.grandTotal' },
        paymentMethods: {
          $push: '$payment.method'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalItems: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        paymentMethods: 1
      }
    }
  ]);
};

// Static method to get daily sales for charts
saleSchema.statics.getDailySales = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate },
        status: { $in: ['completed', 'partially-returned'] }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date'
          }
        },
        total: { $sum: '$totals.grandTotal' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    },
    {
      $project: {
        date: '$_id',
        total: { $round: ['$total', 2] },
        count: 1,
        _id: 0
      }
    }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);
