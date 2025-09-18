const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Brand code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{2,10}$/, 'Brand code must be 2-10 uppercase letters/numbers']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  logo: {
    type: String,
    trim: true
  },
  manufacturer: {
    name: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  contact: {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
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
brandSchema.index({ code: 1 });
brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });

// Virtuals
brandSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'brand'
});

// Methods
brandSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  return obj;
};

// Statics
brandSchema.statics.getActiveBrands = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model('Brand', brandSchema);