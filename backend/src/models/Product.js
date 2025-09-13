const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9-_]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, and underscores']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: [
      'Bakery', 'Dairy', 'Produce', 'Meat', 'Grains', 'Pantry', 
      'Beverages', 'Snacks', 'Frozen', 'Household', 'Personal Care', 'Other'
    ]
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'box', 'bottle', 'can', 'sachet']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [999999.99, 'Price cannot exceed ₹999,999.99'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v > 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Quantity must be a non-negative integer'
    }
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Reorder level must be a non-negative integer'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values but unique non-null values
    match: [/^[0-9]+$/, 'Barcode can only contain numbers']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  // Nutritional info for grocery items
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  // Expiry tracking for perishables
  expiryDate: Date,
  batchNumber: String,
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and search
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ barcode: 1 }, { sparse: true });
productSchema.index({ isActive: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ reorderLevel: 1 });

// Compound indexes for common queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' }); // Text search

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderLevel;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out-of-stock';
  if (this.quantity <= this.reorderLevel) return 'low-stock';
  if (this.quantity <= this.reorderLevel * 2) return 'medium-stock';
  return 'in-stock';
});

// Virtual for display name (name + brand)
productSchema.virtual('displayName').get(function() {
  return this.brand ? `${this.name} - ${this.brand}` : this.name;
});

// Instance method to check if product can fulfill order
productSchema.methods.canFulfillOrder = function(requestedQuantity) {
  return this.quantity >= requestedQuantity;
};

// Instance method to update stock
productSchema.methods.updateStock = async function(quantityChange, reason = 'manual') {
  const newQuantity = this.quantity + quantityChange;
  
  if (newQuantity < 0) {
    throw new Error(`Insufficient stock. Available: ${this.quantity}, Requested: ${Math.abs(quantityChange)}`);
  }
  
  this.quantity = newQuantity;
  return this.save();
};

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.aggregate([
    {
      $match: {
        isActive: true,
        $expr: { $lte: ['$quantity', '$reorderLevel'] }
      }
    },
    {
      $sort: { quantity: 1, name: 1 }
    }
  ]);
};

// Static method to search products
productSchema.statics.search = function(searchTerm, filters = {}) {
  const query = { isActive: true, ...filters };
  
  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { sku: { $regex: searchTerm, $options: 'i' } },
      { brand: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { barcode: searchTerm }
    ];
  }
  
  return this.find(query).sort({ name: 1 });
};

// Pre-save middleware for validation
productSchema.pre('save', function(next) {
  // Ensure SKU is always uppercase
  if (this.sku) {
    this.sku = this.sku.toUpperCase();
  }
  
  // Auto-generate SKU if not provided
  if (!this.sku && this.name && this.category) {
    const nameCode = this.name.substring(0, 3).toUpperCase();
    const categoryCode = this.category.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.sku = `${categoryCode}${nameCode}${timestamp}`;
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);
