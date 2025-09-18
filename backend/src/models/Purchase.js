const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Denormalized product data for historical accuracy
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0.01, 'Unit price must be greater than 0']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  discount: {
    amount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  tax: {
    rate: { type: Number, default: 18, min: 0, max: 100 },
    amount: { type: Number, default: 0 }
  },
  expiryDate: Date,
  batchNumber: String,
  manufacturingDate: Date
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  items: [purchaseItemSchema],
  
  // Financial details
  totals: {
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },
  
  // Purchase details
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Documents
  invoiceNumber: String,
  invoiceDate: Date,
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'delivery_note', 'other']
    }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'ordered', 'partial_received', 'received', 'cancelled'],
    default: 'pending'
  },
  
  // Payment details
  payment: {
    method: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'credit', 'online'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending'
    },
    dueDate: Date,
    paidAmount: { type: Number, default: 0 },
    reference: String
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ supplier: 1, orderDate: -1 });
purchaseSchema.index({ branch: 1, orderDate: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ 'payment.status': 1 });
purchaseSchema.index({ orderDate: -1 });

// Pre-save middleware to calculate totals
purchaseSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    this.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = item.discount.amount || (itemTotal * item.discount.percentage / 100);
      const taxableAmount = itemTotal - discountAmount;
      const taxAmount = taxableAmount * item.tax.rate / 100;
      
      item.totalPrice = itemTotal;
      item.discount.amount = discountAmount;
      item.tax.amount = taxAmount;
      
      subtotal += itemTotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });
    
    this.totals.subtotal = subtotal;
    this.totals.totalDiscount = totalDiscount;
    this.totals.totalTax = totalTax;
    this.totals.totalAmount = subtotal - totalDiscount + totalTax + (this.totals.shippingCharges || 0);
  }
  next();
});

// Methods
purchaseSchema.methods.markAsReceived = function(receivedBy) {
  this.status = 'received';
  this.actualDeliveryDate = new Date();
  this.receivedBy = receivedBy;
  return this.save();
};

purchaseSchema.methods.updatePayment = function(amount, method, reference) {
  this.payment.paidAmount = (this.payment.paidAmount || 0) + amount;
  this.payment.method = method;
  this.payment.reference = reference;
  
  if (this.payment.paidAmount >= this.totals.totalAmount) {
    this.payment.status = 'paid';
  } else if (this.payment.paidAmount > 0) {
    this.payment.status = 'partial';
  }
  
  return this.save();
};

// Statics
purchaseSchema.statics.generatePurchaseNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `PO${year}${month}`;
  
  const lastPurchase = await this.findOne({
    purchaseNumber: { $regex: `^${prefix}` }
  }).sort({ purchaseNumber: -1 });
  
  let nextNumber = 1;
  if (lastPurchase) {
    const lastNumber = parseInt(lastPurchase.purchaseNumber.substring(prefix.length));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('Purchase', purchaseSchema);