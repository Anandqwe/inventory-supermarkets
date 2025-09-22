/**
 * Enhanced Authentication middleware for JWT token verification with RBAC
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user with enhanced security
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token'
        });
      } else {
        throw error;
      }
    }
    
    // Find user and check if still exists
    const user = await User.findById(decoded.userId)
      .select('-password -refreshTokens')
      .populate('branch', 'name code');
      
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or token invalid'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      branch: user.branch,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return ResponseUtils.unauthorized(res, 'Authentication required');
  }

  if (req.user.role !== 'Admin') {
    return ResponseUtils.forbidden(res, 'Admin access required');
  }

  next();
};

/**
 * Middleware to check if user has manager or admin role
 */
const requireManager = (req, res, next) => {
  if (!req.user) {
    return ResponseUtils.unauthorized(res, 'Authentication required');
  }

  if (!['Admin', 'Manager'].includes(req.user.role)) {
    return ResponseUtils.forbidden(res, 'Manager or admin access required');
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of roles that can access the endpoint
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions - role not authorized',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware with enhanced structure support
 * @param {string} permission - Permission string in format 'resource.action' or flat permission name
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || {};
    
    // Check if user has the required permission
    const hasPermission = checkPermission(userPermissions, permission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permission
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {object} userPermissions - User's permission object
 * @param {string} permission - Permission to check
 */
function checkPermission(userPermissions, permission) {
  // Handle nested permission structure (e.g., 'products.create')
  if (permission.includes('.')) {
    const [resource, action] = permission.split('.');
    return userPermissions[resource] && userPermissions[resource][action];
  }
  
  // Handle flat permission names for backward compatibility
  const permissionMap = {
    // Products
    'view_products': userPermissions.products?.read,
    'manage_products': userPermissions.products?.create,
    'create_products': userPermissions.products?.create,
    'update_products': userPermissions.products?.update,
    'delete_products': userPermissions.products?.delete,
    
    // Sales
    'view_sales': userPermissions.sales?.read,
    'make_sales': userPermissions.sales?.create,
    'create_sales': userPermissions.sales?.create,
    'update_sales': userPermissions.sales?.update,
    'delete_sales': userPermissions.sales?.delete,
    
    // Inventory
    'view_inventory': userPermissions.inventory?.read,
    'manage_inventory': userPermissions.inventory?.create,
    'manage_transfers': userPermissions.inventory?.update,
    'approve_adjustments': userPermissions.inventory?.update,
    
    // Reports
    'view_reports': userPermissions.reports?.read,
    'export_reports': userPermissions.reports?.export,
    
    // Users
    'view_users': userPermissions.users?.read,
    'manage_users': userPermissions.users?.create,
    'create_users': userPermissions.users?.create,
    'update_users': userPermissions.users?.update,
    'delete_users': userPermissions.users?.delete,
    
    // Master Data
    'view_categories': userPermissions.masterData?.categories,
    'manage_categories': userPermissions.masterData?.categories,
    'view_brands': userPermissions.masterData?.brands,
    'manage_brands': userPermissions.masterData?.brands,
    'view_units': userPermissions.masterData?.units,
    'manage_units': userPermissions.masterData?.units,
    'view_suppliers': userPermissions.masterData?.suppliers,
    'manage_suppliers': userPermissions.masterData?.suppliers,
    'view_branches': userPermissions.masterData?.branches,
    
    // Financial
    'view_invoices': userPermissions.financial?.invoices,
    'create_invoices': userPermissions.financial?.invoices,
    'edit_invoices': userPermissions.financial?.invoices,
    'send_invoices': userPermissions.financial?.invoices,
    'void_invoices': userPermissions.financial?.invoices,
    'delete_invoices': userPermissions.financial?.invoices,
    'create_bulk_invoices': userPermissions.financial?.invoices,
    'view_payments': userPermissions.financial?.payments,
    'record_payments': userPermissions.financial?.payments,
    'void_payments': userPermissions.financial?.payments,
    'view_financial_reports': userPermissions.financial?.reports,
    'view_financial_dashboard': userPermissions.financial?.reports,
    'view_tax_reports': userPermissions.financial?.reports,
    
    // Purchase Orders
    'view_purchase_orders': userPermissions.inventory?.read,
    'create_purchase_orders': userPermissions.inventory?.create,
    'edit_purchase_orders': userPermissions.inventory?.update,
    'approve_purchase_orders': userPermissions.inventory?.update,
    'send_purchase_orders': userPermissions.inventory?.update,
    'cancel_purchase_orders': userPermissions.inventory?.update,
    'delete_purchase_orders': userPermissions.inventory?.delete,
    'receive_purchases': userPermissions.inventory?.update,
    'view_purchase_receipts': userPermissions.inventory?.read,
    'complete_purchase_receipts': userPermissions.inventory?.update,
    'view_purchase_analytics': userPermissions.reports?.read,
    'view_supplier_analytics': userPermissions.reports?.read,
    
    // Security
    'view_audit_logs': userPermissions.security?.auditLogs,
    'view_security_dashboard': userPermissions.security?.dashboard
  };
  
  return permissionMap[permission] || false;
}

/**
 * Combined middleware for common permission patterns
 */
const authMiddleware = {
  // Basic authentication
  auth: authenticateToken,
  
  // Role-based access
  adminOnly: [authenticateToken, requireRole(['Admin'])],
  adminOrManager: [authenticateToken, requireRole(['Admin', 'Manager'])],
  staffOnly: [authenticateToken, requireRole(['Admin', 'Manager', 'Cashier'])],
  allRoles: [authenticateToken, requireRole(['Admin', 'Manager', 'Cashier', 'Viewer'])],
  
  // Permission-based access
  canManageUsers: [authenticateToken, requirePermission(['manage_users'])],
  canManageProducts: [authenticateToken, requirePermission(['manage_products'])],
  canViewProducts: [authenticateToken, requirePermission(['view_products', 'manage_products'])],
  canMakeSales: [authenticateToken, requirePermission(['make_sales'])],
  canViewSales: [authenticateToken, requirePermission(['view_sales', 'make_sales'])],
  canManageInventory: [authenticateToken, requirePermission(['manage_inventory'])],
  canViewReports: [authenticateToken, requirePermission(['view_reports'])],
  canManageSettings: [authenticateToken, requirePermission(['manage_settings'])]
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireManager,
  requireRole,
  requirePermission,
  authMiddleware
};
