/**
 * RBAC-aware authentication and authorization middleware
 */
const User = require('../models/User');
const ResponseUtils = require('../utils/responseUtils');
const TokenUtils = require('../utils/tokenUtils');
const {
  hasAnyPermission: sharedHasAnyPermission,
  hasAllPermissions: sharedHasAllPermissions
} = require('../../../shared/permissions');

const MANAGER_ROLES = ['Admin', 'Regional Manager', 'Store Manager', 'Inventory Manager'];

const buildRequestUser = (userDoc) => ({
  id: userDoc._id,
  userId: userDoc._id,
  email: userDoc.email,
  role: userDoc.role,
  permissions: Array.isArray(userDoc.permissions) ? userDoc.permissions : [],
  branch: userDoc.branch,
  firstName: userDoc.firstName,
  lastName: userDoc.lastName
});

const normalizeRoleInput = (roles) => {
  if (!roles) {
    return [];
  }

  return Array.isArray(roles) ? roles : [roles];
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = TokenUtils.extractToken(req.headers.authorization);

    if (!token) {
      return ResponseUtils.unauthorized(res, 'Access token is required');
    }

    let decoded;

    try {
      decoded = TokenUtils.verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return ResponseUtils.unauthorized(res, 'Access token has expired');
      }

      return ResponseUtils.unauthorized(res, 'Invalid access token');
    }

    const user = await User.findById(decoded.id)
      .select('-password -refreshTokens')
      .populate('branch', 'name code');

    if (!user) {
      return ResponseUtils.unauthorized(res, 'User not found or token invalid');
    }

    if (!user.isActive) {
      return ResponseUtils.forbidden(res, 'Account is deactivated');
    }

    if (user.isLocked) {
      return ResponseUtils.error(res, 'Account is temporarily locked', 423);
    }

    req.user = buildRequestUser(user);
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return ResponseUtils.error(res, 'Authentication failed');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = TokenUtils.extractToken(req.headers.authorization);

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = TokenUtils.verifyToken(token);
    } catch (error) {
      return next();
    }

    const user = await User.findById(decoded.id)
      .select('-password -refreshTokens')
      .populate('branch', 'name code');

    if (user && user.isActive && !user.isLocked) {
      req.user = buildRequestUser(user);
    }

    return next();
  } catch (error) {
    return next();
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return ResponseUtils.unauthorized(res);
  }

  if (req.user.role !== 'Admin') {
    return ResponseUtils.forbidden(res, 'Admin access required');
  }

  return next();
};

const requireManager = (req, res, next) => {
  if (!req.user) {
    return ResponseUtils.unauthorized(res);
  }

  if (!MANAGER_ROLES.includes(req.user.role)) {
    return ResponseUtils.forbidden(res, 'Manager level access required');
  }

  return next();
};

const requireRole = (allowedRoles) => {
  const normalizedRoles = normalizeRoleInput(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtils.unauthorized(res);
    }

    if (normalizedRoles.length === 0 || normalizedRoles.includes(req.user.role)) {
      return next();
    }

    return ResponseUtils.forbidden(res, 'Role not authorized for this action');
  };
};

const requirePermission = (permission) => {
  const normalizedPermissions = Array.isArray(permission) ? permission : [permission];

  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtils.unauthorized(res);
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    if (sharedHasAllPermissions(req.user.permissions, normalizedPermissions)) {
      return next();
    }

    return ResponseUtils.forbidden(res, 'Insufficient permissions');
  };
};

const requireAnyPermission = (permissions) => {
  const normalizedPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtils.unauthorized(res);
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    if (sharedHasAnyPermission(req.user.permissions, normalizedPermissions)) {
      return next();
    }

    return ResponseUtils.forbidden(res, 'Insufficient permissions');
  };
};

const requireAllPermissions = (permissions) => {
  const normalizedPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtils.unauthorized(res);
    }

    if (req.user.role === 'Admin') {
      return next();
    }

    if (sharedHasAllPermissions(req.user.permissions, normalizedPermissions)) {
      return next();
    }

    return ResponseUtils.forbidden(res, 'Insufficient permissions');
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireManager,
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
};
