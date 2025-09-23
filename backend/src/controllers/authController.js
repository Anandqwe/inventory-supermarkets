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

class AuthController {
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
   * User login
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    const validation = ValidationUtils.validateRequiredFields(req.body, ['email', 'password']);
    if (!validation.isValid) {
      return ResponseUtils.validationError(res, validation.errors.map(err => ({ message: err })));
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
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
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return ResponseUtils.notFound(res, 'User not found');
    }

    ResponseUtils.success(res, user, 'Profile retrieved successfully');
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
}

module.exports = AuthController;
