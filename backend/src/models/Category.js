const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Category code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{2,10}$/, 'Category code must be 2-10 uppercase letters/numbers']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  image: {
    type: String,
    trim: true
  },
  taxRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
categorySchema.index({ code: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtuals
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Pre-save middleware to set level based on parent
categorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    const parent = await mongoose.model('Category').findById(this.parentCategory);
    if (parent) {
      this.level = parent.level + 1;
    }
  }
  next();
});

// Methods
categorySchema.methods.getFullPath = async function() {
  let path = [this.name];
  let current = this;
  
  while (current.parentCategory) {
    current = await mongoose.model('Category').findById(current.parentCategory);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }
  
  return path.join(' > ');
};

// Statics
categorySchema.statics.getHierarchy = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $graphLookup: {
        from: 'categories',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentCategory',
        as: 'children',
        maxDepth: 2
      }
    },
    { $match: { parentCategory: null } },
    { $sort: { sortOrder: 1, name: 1 } }
  ]);
};

module.exports = mongoose.model('Category', categorySchema);