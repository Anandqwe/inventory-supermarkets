const mongoose = require('mongoose');

/**
 * Audit Log Schema
 * Tracks all user actions and system events for security and compliance
 */
const auditLogSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.action !== 'system';
    }
  },
  
  userEmail: {
    type: String,
    required: function() {
      return this.action !== 'system';
    }
  },
  
  userRole: {
    type: String,
    required: function() {
      return this.action !== 'system';
    }
  },
  
  // Branch Information
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  
  branchName: String,
  
  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'login', 'logout', 'login_failed', 'password_change', 'account_locked',
      'token_refresh', 'password_reset_request', 'password_reset_complete',
      
      // User management
      'user_create', 'user_update', 'user_delete', 'user_role_change',
      'user_permissions_change', 'user_activate', 'user_deactivate',
      
      // Product management
      'product_create', 'product_update', 'product_delete', 'product_activate',
      'product_deactivate', 'product_price_change', 'product_stock_update',
      
      // Sales actions
      'sale_create', 'sale_update', 'sale_delete', 'sale_refund',
      'sale_payment_add', 'sale_void',
      
      // Inventory actions
      'stock_adjustment', 'stock_transfer', 'stock_receive',
      'inventory_count', 'reorder_trigger',
      
      // Purchase actions
      'purchase_order_create', 'purchase_order_approve', 'purchase_order_reject',
      'purchase_order_send', 'purchase_order_cancel', 'purchase_receive',
      
      // Financial actions
      'invoice_create', 'invoice_send', 'invoice_void', 'payment_record',
      'payment_void', 'financial_report_generate',
      
      // Master data actions
      'category_create', 'category_update', 'category_delete',
      'brand_create', 'brand_update', 'brand_delete',
      'unit_create', 'unit_update', 'unit_delete',
      'supplier_create', 'supplier_update', 'supplier_delete',
      'branch_create', 'branch_update', 'branch_delete',
      
      // System actions
      'system_startup', 'system_shutdown', 'backup_create', 'data_import',
      'data_export', 'config_change', 'security_event', 'system_error',
      'post_unknown', 'get_unknown', 'put_unknown', 'delete_unknown'
    ]
  },
  
  // Resource Information
  resourceType: {
    type: String,
    required: true,
    enum: [
      'user', 'product', 'sale', 'inventory', 'purchase', 'invoice',
      'payment', 'category', 'brand', 'unit', 'supplier', 'branch',
      'report', 'system', 'config', 'unknown'
    ]
  },
  
  resourceId: {
    type: String  // Can be ObjectId or other identifier
  },
  
  resourceName: String,
  
  // Request Information
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  
  endpoint: String,
  
  // IP and Location
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: String,
  
  location: {
    country: String,
    region: String,
    city: String
  },
  
  // Status and Result
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'warning', 'error'],
    default: 'success'
  },
  
  statusCode: Number,
  
  // Details
  description: {
    type: String,
    required: true
  },
  
  oldValues: {
    type: mongoose.Schema.Types.Mixed  // Store previous values for updates
  },
  
  newValues: {
    type: mongoose.Schema.Types.Mixed  // Store new values for creates/updates
  },
  
  errorMessage: String,
  
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // Flags
  flags: [{
    type: String,
    enum: [
      'sensitive_data', 'financial_action', 'bulk_operation',
      'admin_action', 'cross_branch', 'after_hours',
      'suspicious_activity', 'repeated_failure'
    ]
  }],
  
  // Performance metrics
  responseTime: Number,  // in milliseconds
  
  // Session information
  sessionId: String,
  
  correlationId: String,  // For tracking related actions
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed  // Additional context-specific data
  }
}, {
  timestamps: true,
  // Index for efficient querying
  indexes: [
    { userId: 1, createdAt: -1 },
    { action: 1, createdAt: -1 },
    { resourceType: 1, resourceId: 1 },
    { ipAddress: 1, createdAt: -1 },
    { riskLevel: 1, createdAt: -1 },
    { branchId: 1, createdAt: -1 },
    { status: 1, createdAt: -1 }
  ]
});

// Static methods for common audit operations
auditLogSchema.statics.logUserAction = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error to avoid breaking main operation
  }
};

// Static method to get user activity summary
auditLogSchema.statics.getUserActivity = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to detect suspicious activity
auditLogSchema.statics.detectSuspiciousActivity = async function(options = {}) {
  const {
    timeWindow = 60, // minutes
    failureThreshold = 5,
    ipAddress,
    userId
  } = options;
  
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - timeWindow);
  
  const matchCriteria = {
    createdAt: { $gte: startTime },
    status: 'failure'
  };
  
  if (ipAddress) matchCriteria.ipAddress = ipAddress;
  if (userId) matchCriteria.userId = new mongoose.Types.ObjectId(userId);
  
  const failures = await this.countDocuments(matchCriteria);
  
  return {
    suspicious: failures >= failureThreshold,
    failureCount: failures,
    threshold: failureThreshold,
    timeWindow
  };
};

// Pre-save middleware to set risk level
auditLogSchema.pre('save', function(next) {
  // Auto-set risk level based on action and context
  if (!this.riskLevel || this.riskLevel === 'low') {
    if (this.flags.includes('critical_action') || 
        ['user_delete', 'data_export', 'config_change'].includes(this.action)) {
      this.riskLevel = 'critical';
    } else if (this.flags.includes('financial_action') || 
               this.action.includes('admin') ||
               this.flags.includes('bulk_operation')) {
      this.riskLevel = 'high';
    } else if (this.flags.includes('sensitive_data') || 
               this.status === 'failure') {
      this.riskLevel = 'medium';
    }
  }
  
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;