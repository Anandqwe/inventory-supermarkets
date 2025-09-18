const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
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
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Cashier', 'Viewer'],
    default: 'Cashier',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: function() {
      return this.role !== 'Admin';
    }
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    userAgent: String,
    ipAddress: String
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ branch: 1 });
userSchema.index({ 'refreshTokens.token': 1 });

// Virtual for account locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    this.setDefaultPermissions();
  }
  next();
});

// Method to set default permissions based on role
userSchema.methods.setDefaultPermissions = function() {
  const rolePermissions = {
    Admin: [
      'users:create', 'users:read', 'users:update', 'users:delete',
      'products:create', 'products:read', 'products:update', 'products:delete', 'products:export',
      'sales:create', 'sales:read', 'sales:update', 'sales:delete', 'sales:refund',
      'inventory:read', 'inventory:update',
      'reports:read', 'reports:analytics',
      'dashboard:read', 'dashboard:analytics',
      'branches:create', 'branches:read', 'branches:update', 'branches:delete',
      'audit:read', 'session:manage', 'permissions:update', 'roles:read',
      'profile:read', 'profile:update'
    ],
    Manager: [
      'users:create', 'users:read', 'users:update',
      'products:create', 'products:read', 'products:update', 'products:export',
      'sales:create', 'sales:read', 'sales:update', 'sales:refund',
      'inventory:read', 'inventory:update',
      'reports:read', 'reports:analytics',
      'dashboard:read', 'dashboard:analytics',
      'branches:read', 'audit:read',
      'profile:read', 'profile:update'
    ],
    Cashier: [
      'products:read',
      'sales:create', 'sales:read',
      'inventory:read',
      'reports:read',
      'dashboard:read',
      'profile:read', 'profile:update'
    ],
    Viewer: [
      'products:read',
      'sales:read',
      'inventory:read',
      'reports:read',
      'dashboard:read',
      'profile:read'
    ]
  };
  
  if (rolePermissions[this.role]) {
    this.permissions = rolePermissions[this.role];
  }
};

// Method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Method to add refresh token
userSchema.methods.addRefreshToken = function(token, userAgent, ipAddress) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  
  this.refreshTokens.push({
    token,
    userAgent,
    ipAddress,
    expiresAt
  });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save();
};

// Method to replace refresh token
userSchema.methods.replaceRefreshToken = function(oldToken, newToken) {
  const tokenIndex = this.refreshTokens.findIndex(rt => rt.token === oldToken);
  if (tokenIndex !== -1) {
    this.refreshTokens[tokenIndex].token = newToken;
    this.refreshTokens[tokenIndex].createdAt = new Date();
  }
  return this.save();
};

// Method to clear all refresh tokens
userSchema.methods.clearRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it's not locked, lock the account
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

module.exports = User;
