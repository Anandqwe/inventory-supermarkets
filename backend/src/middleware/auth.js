/**
 * Authentication middleware for JWT token verification
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ResponseUtils = require('../utils/responseUtils');

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return ResponseUtils.unauthorized(res, 'Access token is required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return ResponseUtils.unauthorized(res, 'User not found or token invalid');
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseUtils.forbidden(res, 'Account is deactivated');
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ResponseUtils.unauthorized(res, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      return ResponseUtils.unauthorized(res, 'Token has expired');
    } else {
      console.error('Auth middleware error:', error);
      return ResponseUtils.error(res, 'Authentication failed');
    }
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return ResponseUtils.unauthorized(res, 'Authentication required');
  }

  if (req.user.role !== 'admin') {
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

  if (!['admin', 'manager'].includes(req.user.role)) {
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
 * Middleware to extract user info from token without strict verification
 * Useful for logging or analytics
 */
const extractUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      // Don't verify expiration, just decode
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        req.tokenInfo = {
          userId: decoded.id,
          role: decoded.role,
          exp: decoded.exp
        };
      }
    }

    next();
  } catch (error) {
    // Continue without token info
    next();
  }
};

/**
 * Rate limiting by user ID
 */
const createUserRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    }

    // Check rate limit
    const userRequests = requests.get(userId) || [];
    if (userRequests.length >= maxRequests) {
      return ResponseUtils.error(res, 'Rate limit exceeded. Please try again later.', 429);
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireManager,
  optionalAuth,
  extractUser,
  createUserRateLimit
};
