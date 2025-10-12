const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerNumber: {
    type: String,
    unique: true,
    required: true
  },

  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },

  // Contact Information
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },

  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'both'],
      default: 'both'
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],

  // Business Information
  customerType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  companyName: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  taxId: {
    type: String,
    trim: true
  },

  // Customer Classification
  customerGroup: {
    type: String,
    enum: ['regular', 'vip', 'wholesale', 'retail'],
    default: 'regular'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Purchase History Summary
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  firstPurchaseDate: {
    type: Date
  },

  // Payment Information
  preferredPaymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'credit']
  },
  currentBalance: {
    type: Number,
    default: 0
  },

  // Status and Flags
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isBlacklisted: {
    type: Boolean,
    default: false
  },
  blacklistReason: {
    type: String
  },

  // Branch Association
  registeredBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },

  // Additional Information
  dateOfBirth: {
    type: Date
  },
  anniversary: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Marketing Preferences
  marketingConsent: {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    phone: { type: Boolean, default: false }
  },

  // Loyalty Program
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },

  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ customerNumber: 1 });
customerSchema.index({ registeredBranch: 1, isActive: 1 });
customerSchema.index({ customerGroup: 1 });
customerSchema.index({ 'addresses.zipCode': 1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ lastPurchaseDate: -1 });

// Virtuals
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

customerSchema.virtual('defaultAddress').get(function() {
  if (!this.addresses || this.addresses.length === 0) return null;
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

customerSchema.virtual('customerLifetimeValue').get(function() {
  const daysSinceFirst = this.firstPurchaseDate ?
    (new Date() - this.firstPurchaseDate) / (1000 * 60 * 60 * 24) : 0;
  return daysSinceFirst > 0 ? this.totalSpent / (daysSinceFirst / 365) : 0;
});

customerSchema.virtual('isVip').get(function() {
  return this.customerGroup === 'vip' || this.loyaltyTier === 'platinum';
});

// Pre-save middleware to generate customer number
customerSchema.pre('save', async function(next) {
  if (this.isNew && !this.customerNumber) {
    const count = await this.constructor.countDocuments();
    this.customerNumber = `CUST-${String(count + 1).padStart(6, '0')}`;
  }

  // Update average order value
  if (this.totalPurchases > 0) {
    this.averageOrderValue = this.totalSpent / this.totalPurchases;
  }

  // Update loyalty tier based on total spent
  if (this.totalSpent >= 100000) {
    this.loyaltyTier = 'platinum';
  } else if (this.totalSpent >= 50000) {
    this.loyaltyTier = 'gold';
  } else if (this.totalSpent >= 20000) {
    this.loyaltyTier = 'silver';
  }

  next();
});

// Methods
customerSchema.methods.addPurchase = function(amount, purchaseDate = new Date()) {
  this.totalPurchases += 1;
  this.totalSpent += amount;
  this.lastPurchaseDate = purchaseDate;

  if (!this.firstPurchaseDate) {
    this.firstPurchaseDate = purchaseDate;
  }

  this.averageOrderValue = this.totalSpent / this.totalPurchases;

  return this.save();
};

customerSchema.methods.addAddress = function(addressData) {
  // If this is the first address or marked as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
    addressData.isDefault = true;
  }

  this.addresses.push(addressData);
  return this.save();
};

customerSchema.methods.updateAddress = function(addressId, updateData) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }

  // If setting as default, remove default from others
  if (updateData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }

  Object.assign(address, updateData);
  return this.save();
};

customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

customerSchema.methods.redeemLoyaltyPoints = function(points) {
  if (this.loyaltyPoints < points) {
    throw new Error('Insufficient loyalty points');
  }

  this.loyaltyPoints -= points;
  return this.save();
};

// Static methods
customerSchema.statics.searchCustomers = function(query, filters = {}) {
  const searchConditions = { isActive: true };

  if (query) {
    searchConditions.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { customerNumber: { $regex: query, $options: 'i' } }
    ];
  }

  if (filters.customerGroup) {
    searchConditions.customerGroup = filters.customerGroup;
  }

  if (filters.registeredBranch) {
    searchConditions.registeredBranch = filters.registeredBranch;
  }

  if (filters.loyaltyTier) {
    searchConditions.loyaltyTier = filters.loyaltyTier;
  }

  return this.find(searchConditions)
    .populate('registeredBranch', 'name code')
    .sort({ totalSpent: -1 });
};

customerSchema.statics.getTopCustomers = function(limit = 10, branchId = null) {
  const matchConditions = { isActive: true };

  if (branchId) {
    matchConditions.registeredBranch = mongoose.Types.ObjectId(branchId);
  }

  return this.find(matchConditions)
    .sort({ totalSpent: -1 })
    .limit(limit)
    .populate('registeredBranch', 'name code');
};

customerSchema.statics.getCustomerStats = function(branchId = null) {
  const pipeline = [];

  const matchStage = { $match: { isActive: true } };
  if (branchId) {
    matchStage.$match.registeredBranch = mongoose.Types.ObjectId(branchId);
  }

  pipeline.push(matchStage);

  pipeline.push({
    $group: {
      _id: null,
      totalCustomers: { $sum: 1 },
      totalSpent: { $sum: '$totalSpent' },
      averageSpent: { $avg: '$totalSpent' },
      totalPurchases: { $sum: '$totalPurchases' },
      vipCustomers: {
        $sum: {
          $cond: [{ $eq: ['$customerGroup', 'vip'] }, 1, 0]
        }
      }
    }
  });

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Customer', customerSchema);
