const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
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
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  unit: {
    type: String,
    required: true
  }
}, { _id: false });

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true
  },
  fromBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  toBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  items: [transferItemSchema],
  
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  reason: {
    type: String,
    enum: ['restock', 'demand', 'expiry', 'other'],
    required: true
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  transferDate: {
    type: Date,
    default: Date.now
  },
  
  completedDate: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
transferSchema.index({ transferNumber: 1 });
transferSchema.index({ fromBranch: 1, transferDate: -1 });
transferSchema.index({ toBranch: 1, transferDate: -1 });
transferSchema.index({ status: 1 });
transferSchema.index({ transferDate: -1 });

// Validation to prevent transfer to same branch
transferSchema.pre('validate', function(next) {
  if (this.fromBranch && this.toBranch && this.fromBranch.toString() === this.toBranch.toString()) {
    next(new Error('Cannot transfer to the same branch'));
  } else {
    next();
  }
});

// Methods
transferSchema.methods.approve = function(approvedBy) {
  this.status = 'in_transit';
  this.approvedBy = approvedBy;
  return this.save();
};

transferSchema.methods.complete = function(receivedBy) {
  this.status = 'completed';
  this.completedDate = new Date();
  this.receivedBy = receivedBy;
  return this.save();
};

transferSchema.methods.cancel = function() {
  if (this.status === 'pending') {
    this.status = 'cancelled';
    return this.save();
  } else {
    throw new Error('Cannot cancel transfer that is already in progress');
  }
};

// Statics
transferSchema.statics.generateTransferNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `TR${year}${month}`;
  
  const lastTransfer = await this.findOne({
    transferNumber: { $regex: `^${prefix}` }
  }).sort({ transferNumber: -1 });
  
  let nextNumber = 1;
  if (lastTransfer) {
    const lastNumber = parseInt(lastTransfer.transferNumber.substring(prefix.length));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = mongoose.model('Transfer', transferSchema);