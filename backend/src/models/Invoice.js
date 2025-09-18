const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
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
  description: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be positive']
  },
  unit: {
    type: String,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative']
  },
  lineTotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  type: {
    type: String,
    enum: ['sale', 'purchase', 'return', 'credit_note', 'debit_note'],
    required: true
  },
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  
  // Reference to original transaction
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  
  // Customer/Supplier information
  customer: {
    name: {
      type: String,
      required: true
    },
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    taxId: String
  },
  
  // Invoice details
  issueDate: {
    type: Date,
    default: Date.now
  },
  
  dueDate: {
    type: Date
  },
  
  items: [invoiceItemSchema],
  
  // Financial calculations
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  
  totalDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Total discount cannot be negative']
  },
  
  totalTax: {
    type: Number,
    default: 0,
    min: [0, 'Total tax cannot be negative']
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  
  // Payment tracking
  paidAmount: {
    type: Number,
    default: 0
  },
  
  balanceAmount: {
    type: Number,
    default: 0
  },
  
  paymentStatus: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
    default: 'draft'
  },
  
  // Invoice metadata
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled', 'void'],
    default: 'draft'
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  terms: {
    type: String,
    maxlength: [2000, 'Terms cannot exceed 2000 characters']
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  sentAt: Date,
  
  paidAt: Date,
  
  cancelledAt: Date,
  
  // Email tracking
  emailsSent: [{
    sentAt: {
      type: Date,
      default: Date.now
    },
    recipient: String,
    subject: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ branch: 1, issueDate: -1 });
invoiceSchema.index({ type: 1, status: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ 'customer.email': 1 });
invoiceSchema.index({ sale: 1 });
invoiceSchema.index({ purchase: 1 });

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function() {
  if (this.dueDate && this.paymentStatus !== 'paid' && new Date() > this.dueDate) {
    const diffTime = Math.abs(new Date() - this.dueDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return this.daysOverdue > 0;
});

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    // Calculate item totals
    this.items.forEach(item => {
      const discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
      const subtotal = (item.unitPrice * item.quantity) - discountAmount;
      const taxAmount = (subtotal * item.taxRate) / 100;
      item.lineTotal = subtotal + taxAmount;
    });
    
    // Calculate invoice totals
    this.subtotal = this.items.reduce((sum, item) => {
      const discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
      return sum + ((item.unitPrice * item.quantity) - discountAmount);
    }, 0);
    
    this.totalDiscount = this.items.reduce((sum, item) => {
      return sum + ((item.unitPrice * item.quantity * item.discount) / 100);
    }, 0);
    
    this.totalTax = this.items.reduce((sum, item) => {
      const discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
      const subtotal = (item.unitPrice * item.quantity) - discountAmount;
      return sum + ((subtotal * item.taxRate) / 100);
    }, 0);
    
    this.totalAmount = this.subtotal + this.totalTax;
    this.balanceAmount = this.totalAmount - this.paidAmount;
  }
  next();
});

// Methods
invoiceSchema.methods.send = function(recipient) {
  this.status = 'sent';
  this.sentAt = new Date();
  
  this.emailsSent.push({
    recipient: recipient || this.customer.email,
    subject: `Invoice ${this.invoiceNumber}`,
    status: 'sent'
  });
  
  return this.save();
};

invoiceSchema.methods.markAsPaid = function(paidAmount, paidAt = new Date()) {
  this.paidAmount = paidAmount || this.totalAmount;
  this.paidAt = paidAt;
  this.status = 'paid';
  this.paymentStatus = 'paid';
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  return this.save();
};

invoiceSchema.methods.addPayment = function(amount) {
  this.paidAmount += amount;
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    this.paidAt = new Date();
  } else {
    this.paymentStatus = 'partial';
  }
  
  return this.save();
};

invoiceSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  return this.save();
};

invoiceSchema.methods.void = function() {
  this.status = 'void';
  return this.save();
};

// Statics
invoiceSchema.statics.generateInvoiceNumber = async function(type, branchCode) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const typePrefix = {
    'sale': 'INV',
    'purchase': 'PINV',
    'return': 'RET',
    'credit_note': 'CN',
    'debit_note': 'DN'
  };
  
  const prefix = `${typePrefix[type]}-${branchCode}-${year}${month}`;
  
  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });
  
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop());
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
};

invoiceSchema.statics.getOverdueInvoices = function(branchId) {
  return this.find({
    branch: branchId,
    dueDate: { $lt: new Date() },
    paymentStatus: { $in: ['sent', 'partial'] },
    status: { $ne: 'cancelled' }
  }).populate('customer sale purchase');
};

invoiceSchema.statics.getMonthlyRevenue = function(branchId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.aggregate([
    {
      $match: {
        branch: branchId,
        type: 'sale',
        status: 'paid',
        paidAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalInvoices: { $sum: 1 },
        averageInvoiceValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Invoice', invoiceSchema);