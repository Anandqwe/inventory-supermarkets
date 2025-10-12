const mongoose = require('mongoose');

const adjustmentItemSchema = new mongoose.Schema({
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
  currentQuantity: {
    type: Number,
    required: true
  },
  adjustedQuantity: {
    type: Number,
    required: true
  },
  difference: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, { _id: false });

const adjustmentSchema = new mongoose.Schema({
  adjustmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  items: [adjustmentItemSchema],

  type: {
    type: String,
    enum: ['increase', 'decrease', 'correction'],
    required: true
  },

  reason: {
    type: String,
    enum: ['damage', 'theft', 'expiry', 'found', 'count_error', 'other'],
    required: true
  },

  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  adjustmentDate: {
    type: Date,
    default: Date.now
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
adjustmentSchema.index({ adjustmentNumber: 1 });
adjustmentSchema.index({ branch: 1, adjustmentDate: -1 });
adjustmentSchema.index({ status: 1 });
adjustmentSchema.index({ adjustmentDate: -1 });

// Pre-save middleware to calculate differences
adjustmentSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.items.forEach(item => {
      item.difference = item.adjustedQuantity - item.currentQuantity;
    });
  }
  next();
});

// Methods
adjustmentSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  return this.save();
};

adjustmentSchema.methods.reject = function() {
  this.status = 'rejected';
  return this.save();
};

// Statics
adjustmentSchema.statics.generateAdjustmentNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `ADJ${year}${month}`;

  const lastAdjustment = await this.findOne({
    adjustmentNumber: { $regex: `^${prefix}` }
  }).sort({ adjustmentNumber: -1 });

  let nextNumber = 1;
  if (lastAdjustment) {
    const lastNumber = parseInt(lastAdjustment.adjustmentNumber.substring(prefix.length));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('Adjustment', adjustmentSchema);
