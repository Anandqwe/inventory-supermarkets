/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 */
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const TokenUtils = require('../utils/tokenUtils');
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const {
  ROLE_PERMISSIONS,
  normalizeRoleName,
  isBranchScopedRole,
  hasCrossBranchAccess,
  getRolePermissions,
} = require('../../../shared/permissions');

class AuthController {
  /**
   * Register new user (Admin only)
   */
  static register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, role: requestedRole = 'Cashier', branch } = req.body;

    const normalizedRole = normalizeRoleName(requestedRole) || 'Cashier';

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
    const creatorRole = req.user?.role;

    if (!ROLE_PERMISSIONS[normalizedRole]) {
      return ResponseUtils.error(res, 'Invalid role specified', 400);
    }

    const roleCreationMatrix = {
      Admin: Object.keys(ROLE_PERMISSIONS),
      'Regional Manager': ['Store Manager', 'Inventory Manager', 'Cashier'],
      'Store Manager': ['Inventory Manager', 'Cashier'],
    };

    const allowedRoles = roleCreationMatrix[creatorRole] || [];

    if (!allowedRoles.includes(normalizedRole)) {
      return ResponseUtils.forbidden(res, 'You are not authorized to create this role');
    }

    if (['Admin', 'Regional Manager', 'Viewer'].includes(normalizedRole) && creatorRole !== 'Admin') {
      return ResponseUtils.forbidden(res, 'Only admins can create this role');
    }

    const branchScoped = isBranchScopedRole(normalizedRole);
    const creatorBranchId = req.user?.branch && (req.user.branch._id || req.user.branch);

    if (branchScoped) {
      let targetBranchId = branch;

      if (!hasCrossBranchAccess(creatorRole)) {
        targetBranchId = creatorBranchId;
      }

      if (!targetBranchId) {
        return ResponseUtils.error(res, 'Branch is required for branch-scoped roles', 400);
      }

      if (!hasCrossBranchAccess(creatorRole) && creatorBranchId.toString() !== targetBranchId.toString()) {
        return ResponseUtils.forbidden(res, 'Cannot assign users to other branches');
      }

      if (!ValidationUtils.isValidObjectId(targetBranchId)) {
        return ResponseUtils.error(res, 'Invalid branch identifier', 400);
      }

      req.body.branch = targetBranchId;
    } else {
      req.body.branch = undefined;
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName: ValidationUtils.sanitizeString(firstName),
      lastName: ValidationUtils.sanitizeString(lastName),
      phone: phone ? phone.replace(/\s+/g, '') : undefined,
      role: normalizedRole,
      branch: req.body.branch,
      createdBy: req.user?.id,
      permissions: getRolePermissions(normalizedRole)
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
   * User login
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    const validation = ValidationUtils.validateRequiredFields(req.body, ['email', 'password']);
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, validation.errors.map(err => ({ message: err })));
    }

    // Find user with password field and populate branch
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('branch', 'name code address');
    if (!user) {
      return ResponseUtils.unauthorized(res, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      return ResponseUtils.forbidden(res, 'Account is deactivated. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return ResponseUtils.unauthorized(res, 'Invalid email or password');
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = TokenUtils.generateToken(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    ResponseUtils.success(res, {
      user: userResponse,
      token
    }, 'Login successful');
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('branch', 'name code address');
    if (!user) {
      return ResponseUtils.notFound(res, 'User not found');
    }

    ResponseUtils.success(res, user, 'Profile retrieved successfully');
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const { fullName, firstName, lastName, phone, address, email } = req.body;
    const updates = {};

    if (fullName) {
      // Split fullName into firstName and lastName
      const nameParts = ValidationUtils.sanitizeString(fullName).split(' ');
      updates.firstName = nameParts[0] || '';
      updates.lastName = nameParts.slice(1).join(' ') || '';
    } else {
      if (firstName) updates.firstName = ValidationUtils.sanitizeString(firstName);
      if (lastName) updates.lastName = ValidationUtils.sanitizeString(lastName);
    }

    if (phone) {
      if (!ValidationUtils.isValidPhone(phone)) {
        return ResponseUtils.error(res, 'Invalid phone number format. Use 10-digit Indian number (e.g., 9876543210 or +91 9876543210)', 400);
      }
      // Clean phone number: remove spaces, +, and country code, keep only 10 digits
      const cleanedPhone = phone
        .replace(/\s+/g, '')        // Remove spaces
        .replace(/^\+91/, '')       // Remove +91 prefix
        .replace(/^91/, '')         // Remove 91 prefix
        .replace(/^\+/, '');        // Remove any other + prefix
      
      updates.phone = cleanedPhone;
    }

    if (address) {
      updates.address = ValidationUtils.sanitizeString(address);
    }

    // Note: Email updates are typically not allowed or require verification
    // Keeping email read-only for security reasons
    if (email && email !== req.user.email) {
      return ResponseUtils.error(res, 'Email address cannot be changed. Please contact an administrator.', 400);
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
    logger.info(`User ${req.user.id} logged out`, { userId: req.user.id, timestamp: new Date().toISOString() });
    
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
    
    if (role) {
      const normalizedRole = normalizeRoleName(role);
      if (normalizedRole && ROLE_PERMISSIONS[normalizedRole]) {
        filter.role = normalizedRole;
      }
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (!hasCrossBranchAccess(req.user.role)) {
      filter.branch = req.user.branch?._id || req.user.branch;
    }

    // Get users with pagination
    const skip = (pagination.page - 1) * pagination.limit;
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .populate('createdBy', 'fullName email')
        .populate('branch', 'name code'),
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

    if (user.role === 'Admin' && req.user.role !== 'Admin') {
      return ResponseUtils.forbidden(res, 'Only admins can manage other admin accounts');
    }

    if (user.role === 'Regional Manager' && req.user.role !== 'Admin') {
      return ResponseUtils.forbidden(res, 'Only admins can manage regional managers');
    }

    if (!hasCrossBranchAccess(req.user.role)) {
      const targetBranchId = user.branch && (user.branch._id || user.branch);
      const requesterBranchId = req.user.branch && (req.user.branch._id || req.user.branch);

      if (!targetBranchId || targetBranchId.toString() !== requesterBranchId?.toString()) {
        return ResponseUtils.forbidden(res, 'Cannot manage users from other branches');
      }
    }

    if (user.id === req.user.id) {
      return ResponseUtils.error(res, 'Cannot deactivate your own account', 400);
    }

    user.isActive = !user.isActive;
    await user.save();

    ResponseUtils.success(res, {
      userId: user.id,
      isActive: user.isActive
    }, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  });
}

module.exports = AuthController;
