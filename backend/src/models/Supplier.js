const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Supplier code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{3,10}$/, 'Supplier code must be 3-10 uppercase letters/numbers']
  },
  type: {
    type: String,
    enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'other'],
    default: 'distributor'
  },
  contact: {
    person: {
      type: String,
      trim: true,
      maxlength: [50, 'Contact person name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: {
      type: String,
      trim: true
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  tax: {
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format']
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format']
    }
  },
  paymentTerms: {
    creditDays: {
      type: Number,
      default: 30,
      min: 0
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    accountHolderName: {
      type: String,
      trim: true
    }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
supplierSchema.index({ code: 1 });
supplierSchema.index({ name: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ 'tax.gstNumber': 1 });

// Virtuals
supplierSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

supplierSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'supplier'
});

supplierSchema.virtual('purchases', {
  ref: 'Purchase',
  localField: '_id',
  foreignField: 'supplier'
});

// Methods
supplierSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  // Remove sensitive banking information if needed
  return obj;
};

// Statics
supplierSchema.statics.getActiveSuppliers = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

supplierSchema.statics.searchSuppliers = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { 'contact.person': { $regex: query, $options: 'i' } }
    ]
  }).sort({ name: 1 });
};

module.exports = mongoose.model('Supplier', supplierSchema);