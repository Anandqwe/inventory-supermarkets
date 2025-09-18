/**
 * Enhanced Authentication Controller with JWT, RBAC, and Security Features
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const TokenUtils = require('../utils/tokenUtils');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
  /**
   * Generate JWT tokens (access + refresh)
   */
  static generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      branch: user.branch
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register new user (Admin only)
   */
  static register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, role = 'cashier' } = req.body;

    // Validate required fields
    const validation = ValidationUtils.validateRequiredFields(req.body, ['email', 'password', 'firstName', 'lastName']);
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, validation.errors.map(err => ({ message: err })));
    }

    // Validate email format
    if (!ValidationUtils.isValidEmail(email)) {
      return ResponseUtils.error(res, 'Invalid email format', 400);
    }

    // Validate password strength
    const passwordValidation = ValidationUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      return ResponseUtils.validationError(res, passwordValidation.errors.map(err => ({ message: err })));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ResponseUtils.conflict(res, 'User with this email already exists');
    }

    // Validate phone if provided
    if (phone && !ValidationUtils.isValidPhone(phone)) {
      return ResponseUtils.error(res, 'Invalid phone number format', 400);
    }

    // Only admin can create other admins
    if (role === 'admin' && req.user?.role !== 'admin') {
      return ResponseUtils.forbidden(res, 'Only admins can create admin accounts');
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName: ValidationUtils.sanitizeString(firstName),
      lastName: ValidationUtils.sanitizeString(lastName),
      phone: phone ? phone.replace(/\s+/g, '') : undefined,
      role,
      createdBy: req.user?.id
    });

    await user.save();

    // Generate token
    const token = TokenUtils.generateToken(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    ResponseUtils.success(res, {
      user: userResponse,
      token
    }, 'User registered successfully', 201);
  });

  /**
   * Enhanced user login with account locking and security features
   */
  static login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and check if account exists
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +loginAttempts +lockUntil')
      .populate('branch', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        lockUntil: user.lockUntil
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Password is correct - reset login attempts and update last login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    await user.updateLastLogin();

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    // Prepare user response (without sensitive data)
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      branch: user.branch,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      }
    });
  });

  /**
   * Refresh access token using refresh token
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user and check if refresh token is valid
    const user = await User.findById(decoded.userId)
      .populate('branch', 'name code');

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

    // Replace old refresh token with new one
    await user.replaceRefreshToken(refreshToken, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      }
    });
  });

  /**
   * User logout - invalidate refresh token
   */
  static logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const userId = req.user.userId;

    if (refreshToken) {
      // Find user and remove refresh token
      const user = await User.findById(userId);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Logout from all devices - invalidate all refresh tokens
   */
  static logoutAll = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Find user and clear all refresh tokens
    const user = await User.findById(userId);
    if (user) {
      await user.clearRefreshTokens();
    }

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId)
      .select('-password -refreshTokens')
      .populate('branch', 'name code address')
      .populate('createdBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const { fullName, phone } = req.body;
    const updates = {};

    if (fullName) {
      updates.fullName = ValidationUtils.sanitizeString(fullName);
    }

    if (phone) {
      if (!ValidationUtils.isValidPhone(phone)) {
        return ResponseUtils.error(res, 'Invalid phone number format', 400);
      }
      updates.phone = phone.replace(/\s+/g, '');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return ResponseUtils.notFound(res, 'User not found');
    }

    ResponseUtils.success(res, user, 'Profile updated successfully');
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    const validation = ValidationUtils.validateRequiredFields(req.body, ['currentPassword', 'newPassword']);
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, validation.errors.map(err => ({ message: err })));
    }

    // Validate new password strength
    const passwordValidation = ValidationUtils.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return ResponseUtils.validationError(res, passwordValidation.errors.map(err => ({ message: err })));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return ResponseUtils.notFound(res, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return ResponseUtils.unauthorized(res, 'Current password is incorrect');
    }

    // Check if new password is different
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return ResponseUtils.error(res, 'New password must be different from current password', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    ResponseUtils.success(res, null, 'Password changed successfully');
  });

  /**
   * Logout user (client-side token removal)
   */
  static logout = asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // Here we can log the logout event
    console.log(`User ${req.user.id} logged out at ${new Date().toISOString()}`);
    
    ResponseUtils.success(res, null, 'Logged out successfully');
  });

  /**
   * Refresh token
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user || !user.isActive) {
      return ResponseUtils.unauthorized(res, 'User not found or inactive');
    }

    // Generate new token
    const token = TokenUtils.generateToken(user);

    ResponseUtils.success(res, { token }, 'Token refreshed successfully');
  });

  /**
   * Get all users (Admin/Manager only)
   */
  static getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    
    // Validate pagination
    const pagination = ValidationUtils.validatePagination({ page, limit });
    
    // Build filter
    const filter = {};
    
    if (search) {
      const searchQuery = ValidationUtils.cleanSearchQuery(search);
      filter.$or = [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (role && ['admin', 'manager', 'cashier'].includes(role)) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Get users with pagination
    const skip = (pagination.page - 1) * pagination.limit;
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .populate('createdBy', 'fullName email'),
      User.countDocuments(filter)
    ]);

    ResponseUtils.paginated(res, users, { ...pagination, total }, 'Users retrieved successfully');
  });

  /**
   * Toggle user active status (Admin only)
   */
  static toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!ValidationUtils.isValidObjectId(userId)) {
      return ResponseUtils.error(res, 'Invalid user ID', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return ResponseUtils.notFound(res, 'User not found');
    }

    // Prevent deactivating self
    if (user.id === req.user.id) {
      return ResponseUtils.error(res, 'Cannot deactivate your own account', 400);
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    ResponseUtils.success(res, {
      userId: user.id,
      isActive: user.isActive
    }, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens to force re-login on all devices
    await user.clearRefreshTokens();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again on all devices.'
    });
  });

  /**
   * Get user permissions for RBAC
   */
  static getPermissions = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select('role permissions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: {
        role: user.role,
        permissions: user.permissions
      }
    });
  });

  /**
   * Get specific user details (Manager+ only)
   */
  static getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -refreshTokens')
      .populate('branch', 'name code address')
      .populate('createdBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: user
    });
  });

  /**
   * Update user details (Admin only)
   */
  static updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { firstName, lastName, email, role, branchId, phone, permissions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent updating own account through this endpoint
    if (user.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Use profile update endpoint for your own account'
      });
    }

    // Check if email is already taken (if email is being updated)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already in use'
        });
      }
    }

    // Update fields
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email.toLowerCase();
    if (role) updateFields.role = role;
    if (branchId) updateFields.branch = branchId;
    if (phone) updateFields.phone = phone;
    if (permissions) updateFields.permissions = permissions;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .select('-password -refreshTokens')
    .populate('branch', 'name code');

    // Log the update
    await AuditLog.create({
      action: 'USER_UPDATED',
      resourceType: 'User',
      resourceId: userId,
      details: {
        updatedFields: Object.keys(updateFields),
        targetUser: user.email
      },
      user: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  });

  /**
   * Reset user password (Admin only)
   */
  static resetUserPassword = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear all refresh tokens to force re-login
    await user.clearRefreshTokens();

    // Log the password reset
    await AuditLog.create({
      action: 'PASSWORD_RESET',
      resourceType: 'User',
      resourceId: userId,
      details: {
        targetUser: user.email,
        resetBy: 'admin'
      },
      user: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Password reset successfully. User must login again.'
    });
  });

  /**
   * Delete user (Admin only)
   */
  static deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete (deactivate) instead of hard delete for audit purposes
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    // Log the deletion
    await AuditLog.create({
      action: 'USER_DELETED',
      resourceType: 'User',
      resourceId: userId,
      details: {
        targetUser: user.firstName + ' ' + user.lastName,
        originalEmail: user.email
      },
      user: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  /**
   * Get available roles and permissions
   */
  static getRolesAndPermissions = asyncHandler(async (req, res) => {
    const roles = {
      Admin: {
        description: 'Full system access',
        permissions: [
          'users:create', 'users:read', 'users:update', 'users:delete',
          'products:create', 'products:read', 'products:update', 'products:delete', 'products:export',
          'sales:create', 'sales:read', 'sales:update', 'sales:delete', 'sales:refund',
          'inventory:read', 'inventory:update',
          'reports:read', 'reports:analytics',
          'dashboard:read', 'dashboard:analytics',
          'branches:create', 'branches:read', 'branches:update', 'branches:delete',
          'audit:read', 'session:manage', 'permissions:update', 'roles:read'
        ]
      },
      Manager: {
        description: 'Branch management access',
        permissions: [
          'users:create', 'users:read', 'users:update',
          'products:create', 'products:read', 'products:update', 'products:export',
          'sales:create', 'sales:read', 'sales:update', 'sales:refund',
          'inventory:read', 'inventory:update',
          'reports:read', 'reports:analytics',
          'dashboard:read', 'dashboard:analytics',
          'branches:read', 'audit:read'
        ]
      },
      Cashier: {
        description: 'Sales and basic inventory access',
        permissions: [
          'products:read',
          'sales:create', 'sales:read',
          'inventory:read',
          'reports:read',
          'dashboard:read',
          'profile:read', 'profile:update'
        ]
      },
      Viewer: {
        description: 'Read-only access',
        permissions: [
          'products:read',
          'sales:read',
          'inventory:read',
          'reports:read',
          'dashboard:read',
          'profile:read'
        ]
      }
    };

    res.json({
      success: true,
      message: 'Roles and permissions retrieved successfully',
      data: { roles }
    });
  });

  /**
   * Update user permissions (Admin only)
   */
  static updateUserPermissions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { permissions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent updating own permissions
    if (user.id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own permissions'
      });
    }

    // Update permissions
    user.permissions = permissions;
    await user.save();

    // Log the permission update
    await AuditLog.create({
      action: 'PERMISSIONS_UPDATED',
      resourceType: 'User',
      resourceId: userId,
      details: {
        targetUser: user.email,
        newPermissions: permissions
      },
      user: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User permissions updated successfully',
      data: {
        userId: user.id,
        permissions: user.permissions
      }
    });
  });

  /**
   * Get activity logs (Admin only)
   */
  static getActivityLogs = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      userId, 
      resourceType,
      startDate,
      endDate 
    } = req.query;

    const filter = {};
    
    if (action) filter.action = action;
    if (userId) filter.user = userId;
    if (resourceType) filter.resourceType = resourceType;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Activity logs retrieved successfully',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  /**
   * Get login history for specific user
   */
  static getUserLoginHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skip = (page - 1) * limit;

    const [loginLogs, total] = await Promise.all([
      AuditLog.find({
        user: userId,
        action: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'] }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments({
        user: userId,
        action: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'] }
      })
    ]);

    res.json({
      success: true,
      message: 'Login history retrieved successfully',
      data: {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        logs: loginLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  /**
   * Force user logout (Admin only)
   */
  static forceUserLogout = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear all refresh tokens to force logout from all devices
    await user.clearRefreshTokens();

    // Log the forced logout
    await AuditLog.create({
      action: 'FORCED_LOGOUT',
      resourceType: 'User',
      resourceId: userId,
      details: {
        targetUser: user.email,
        forcedBy: req.user.userId
      },
      user: req.user.userId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User forced logout successfully'
    });
  });
}

module.exports = AuthController;
