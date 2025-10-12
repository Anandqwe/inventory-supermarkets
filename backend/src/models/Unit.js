const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    trim: true,
    maxlength: [20, 'Unit name cannot exceed 20 characters']
  },
  code: {
    type: String,
    required: [true, 'Unit code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{1,5}$/, 'Unit code must be 1-5 uppercase letters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [100, 'Description cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['weight', 'volume', 'length', 'area', 'count', 'time'],
    required: [true, 'Unit type is required']
  },
  baseUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },
  conversionFactor: {
    type: Number,
    default: 1,
    min: [0.000001, 'Conversion factor must be positive']
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
unitSchema.index({ code: 1 });
unitSchema.index({ type: 1 });
unitSchema.index({ isActive: 1 });

// Virtuals
unitSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'unit'
});

// Methods
unitSchema.methods.convertTo = function(targetUnit, value) {
  if (this.type !== targetUnit.type) {
    throw new Error('Cannot convert between different unit types');
  }

  // Convert to base unit first, then to target unit
  const baseValue = value * this.conversionFactor;
  return baseValue / targetUnit.conversionFactor;
};

// Statics
unitSchema.statics.getByType = function(type) {
  return this.find({ type, isActive: true }).sort({ name: 1 });
};

unitSchema.statics.getActiveUnits = function() {
  return this.find({ isActive: true }).sort({ type: 1, name: 1 });
};

module.exports = mongoose.model('Unit', unitSchema);
