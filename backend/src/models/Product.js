const mongoose = require('mongoose');

// Stock schema for per-branch inventory
const stockSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Max stock level cannot be negative'],
    default: 1000
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    trim: true,
    maxlength: [50, 'Location cannot exceed 50 characters']
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    index: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9-_]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, and underscores'],
    index: true
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true,
    match: [/^[0-9]+$/, 'Barcode can only contain numbers'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Categorization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    index: true
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: [true, 'Unit is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true
  },
  
  // Pricing
  pricing: {
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0.01, 'Cost price must be greater than 0']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0.01, 'Selling price must be greater than 0']
    },
    mrp: {
      type: Number,
      min: [0.01, 'MRP must be greater than 0']
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100
    }
  },
  
  // Multi-branch inventory
  stockByBranch: [stockSchema],
  
  // Product details
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    color: String,
    material: String,
    warranty: {
      duration: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years']
      }
    }
  },
  
  // Dates
  manufacturingDate: Date,
  expiryDate: {
    type: Date,
    index: true
  },
  
  // Images and documents
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['datasheet', 'manual', 'certificate', 'other']
    }
  }],
  
  // Status and flags
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPerishable: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  
  // SEO and tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  slug: {
    type: String,
    unique: true,
    sparse: true
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
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ 'pricing.sellingPrice': 1 });
productSchema.index({ expiryDate: 1, isPerishable: 1 });
productSchema.index({ 'stockByBranch.branch': 1, 'stockByBranch.quantity': 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// Virtual for total quantity across all branches
productSchema.virtual('totalQuantity').get(function() {
  return this.stockByBranch.reduce((total, stock) => total + stock.quantity, 0);
});

// Virtual for available quantity (total - reserved)
productSchema.virtual('availableQuantity').get(function() {
  return this.stockByBranch.reduce((total, stock) => total + (stock.quantity - (stock.reservedQuantity || 0)), 0);
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice && this.pricing.sellingPrice) {
    return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice * 100).toFixed(2);
  }
  return 0;
});

// Virtual to check if product is low stock in any branch
productSchema.virtual('isLowStock').get(function() {
  return this.stockByBranch.some(stock => stock.quantity <= stock.reorderLevel);
});

// Virtual to check if product is out of stock in any branch
productSchema.virtual('isOutOfStock').get(function() {
  return this.stockByBranch.some(stock => stock.quantity === 0);
});

// Virtual to check if product is near expiry (within 30 days)
productSchema.virtual('isNearExpiry').get(function() {
  if (!this.expiryDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow;
});

// Virtual to check if product is expired
productSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Methods
productSchema.methods.getStockByBranch = function(branchId) {
  return this.stockByBranch.find(stock => stock.branch.toString() === branchId.toString());
};

productSchema.methods.updateStock = function(branchId, quantity, operation = 'set') {
  const stockIndex = this.stockByBranch.findIndex(stock => stock.branch.toString() === branchId.toString());
  
  if (stockIndex === -1) {
    // Create new stock entry for branch
    this.stockByBranch.push({
      branch: branchId,
      quantity: operation === 'set' ? quantity : 0,
      reorderLevel: 10,
      maxStockLevel: 1000
    });
  } else {
    // Update existing stock
    const currentStock = this.stockByBranch[stockIndex];
    switch (operation) {
      case 'add':
        currentStock.quantity += quantity;
        break;
      case 'subtract':
        currentStock.quantity = Math.max(0, currentStock.quantity - quantity);
        break;
      case 'set':
      default:
        currentStock.quantity = quantity;
        break;
    }
    currentStock.lastRestocked = new Date();
  }
  
  return this.save();
};

productSchema.methods.reserveStock = function(branchId, quantity) {
  const stock = this.getStockByBranch(branchId);
  if (!stock) {
    throw new Error('Stock not found for this branch');
  }
  
  if (stock.quantity - (stock.reservedQuantity || 0) < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  stock.reservedQuantity = (stock.reservedQuantity || 0) + quantity;
  return this.save();
};

productSchema.methods.releaseStock = function(branchId, quantity) {
  const stock = this.getStockByBranch(branchId);
  if (!stock) {
    throw new Error('Stock not found for this branch');
  }
  
  stock.reservedQuantity = Math.max(0, (stock.reservedQuantity || 0) - quantity);
  return this.save();
};

// Static methods
productSchema.statics.searchProducts = function(query, filters = {}) {
  const searchConditions = { isActive: true };
  
  if (query) {
    searchConditions.$text = { $search: query };
  }
  
  if (filters.category) {
    searchConditions.category = filters.category;
  }
  
  if (filters.brand) {
    searchConditions.brand = filters.brand;
  }
  
  if (filters.supplier) {
    searchConditions.supplier = filters.supplier;
  }
  
  if (filters.priceMin || filters.priceMax) {
    searchConditions['pricing.sellingPrice'] = {};
    if (filters.priceMin) {
      searchConditions['pricing.sellingPrice'].$gte = filters.priceMin;
    }
    if (filters.priceMax) {
      searchConditions['pricing.sellingPrice'].$lte = filters.priceMax;
    }
  }
  
  if (filters.lowStock) {
    searchConditions['stockByBranch'] = {
      $elemMatch: {
        $expr: { $lte: ['$quantity', '$reorderLevel'] }
      }
    };
  }
  
  if (filters.outOfStock) {
    searchConditions['stockByBranch.quantity'] = 0;
  }
  
  if (filters.nearExpiry) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    searchConditions.expiryDate = {
      $gte: new Date(),
      $lte: thirtyDaysFromNow
    };
  }
  
  return this.find(searchConditions)
    .populate('category', 'name code')
    .populate('brand', 'name code')
    .populate('unit', 'name code')
    .populate('supplier', 'name code')
    .populate('stockByBranch.branch', 'name code');
};

productSchema.statics.getLowStockProducts = function(branchId = null) {
  const matchConditions = {
    isActive: true,
    stockByBranch: {
      $elemMatch: {
        $expr: { $lte: ['$quantity', '$reorderLevel'] }
      }
    }
  };
  
  if (branchId) {
    matchConditions.stockByBranch.$elemMatch.branch = mongoose.Types.ObjectId(branchId);
  }
  
  return this.find(matchConditions)
    .populate('category', 'name')
    .populate('brand', 'name')
    .populate('stockByBranch.branch', 'name code');
};

productSchema.statics.getExpiringProducts = function(days = 30, branchId = null) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const matchConditions = {
    isActive: true,
    isPerishable: true,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  };
  
  if (branchId) {
    matchConditions['stockByBranch.branch'] = mongoose.Types.ObjectId(branchId);
  }
  
  return this.find(matchConditions)
    .populate('category', 'name')
    .populate('brand', 'name')
    .populate('stockByBranch.branch', 'name code')
    .sort({ expiryDate: 1 });
};

module.exports = mongoose.model('Product', productSchema);