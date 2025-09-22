/**
 * Enhanced Authentication Routes with Comprehensive Security Features
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and management
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           example: 64a5b2c3d4e5f6789012345
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         role:
 *           type: string
 *           enum: [Admin, Manager, Cashier, Viewer]
 *           example: Manager
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["users:read", "products:write", "sales:read"]
 *         branchId:
 *           type: string
 *           format: objectId
 *           example: 64a5b2c3d4e5f6789012346
 *         phone:
 *           type: string
 *           example: +1234567890
 *         isActive:
 *           type: boolean
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-01T00:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login endpoint
 */

const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken, requireAdmin, requireManager, requireRole } = require('../middleware/auth');

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     expiresIn:
 *                       type: string
 *                       example: 15m
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 *       403:
 *         description: Account deactivated
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], AuthController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
], AuthController.refreshToken);

// =============================================================================
// PROTECTED ROUTES (Authentication Required)
// =============================================================================

// Apply authentication middleware to all routes below
router.use(authenticateToken);

// =============================================================================
// USER PROFILE MANAGEMENT
// =============================================================================

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', 
  authenticateToken,
  AuthController.getProfile
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: John
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
], 
  authenticateToken,
  AuthController.updateProfile
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: CurrentPass123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password or weak new password
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], 
  authenticateToken,
  AuthController.changePassword
);

/**
 * @swagger
 * /api/auth/permissions:
 *   get:
 *     summary: Get user permissions
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Permissions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: Manager
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["users:read", "products:create", "sales:read"]
 */
router.get('/permissions', 
  authenticateToken,
  AuthController.getPermissions
);

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 */
router.post('/logout', [
  body('refreshToken')
    .optional()
    .notEmpty()
    .withMessage('Refresh token must not be empty')
], AuthController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all sessions
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out from all devices successfully
 */
router.post('/logout-all', 
  authenticateToken,
  AuthController.logoutAll
);

// =============================================================================
// USER MANAGEMENT (Manager+ Only)
// =============================================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user (Manager+ only)
 *     tags: [Authentication, User Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Smith
 *               role:
 *                 type: string
 *                 enum: [Admin, Manager, Cashier, Viewer]
 *                 example: Cashier
 *               branchId:
 *                 type: string
 *                 format: objectId
 *                 example: 64a5b2c3d4e5f6789012345
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         description: Validation error or email already exists
 *       403:
 *         description: Insufficient permissions
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name is required and must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name is required and must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'Cashier', 'Viewer'])
    .withMessage('Role must be Admin, Manager, Cashier, or Viewer'),
  body('branchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid branch ID'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
], 
  requireAdmin,
  AuthController.register
);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users with filtering (Manager+ only)
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Admin, Manager, Cashier, Viewer]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', 
  requireRole(['Admin', 'Manager']),
  requireAdmin,
  AuthController.getAllUsers
);

/**
 * @swagger
 * /api/auth/users/{userId}:
 *   get:
 *     summary: Get specific user details (Manager+ only)
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 *   put:
 *     summary: Update user details (Admin only)
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: updated@example.com
 *               role:
 *                 type: string
 *                 enum: [Admin, Manager, Cashier, Viewer]
 *                 example: Manager
 *               branchId:
 *                 type: string
 *                 format: objectId
 *                 example: 64a5b2c3d4e5f6789012345
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions (Admin only)
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions (Admin only)
 */
router.get('/users/:userId', 
  requireRole(['Admin', 'Manager']),
  requireAdmin,
  AuthController.getUserById
);

router.put('/users/:userId', [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'Cashier', 'Viewer'])
    .withMessage('Role must be Admin, Manager, Cashier, or Viewer'),
  body('branchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid branch ID'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
], 
  requireAdmin,
  requireAdmin,
  AuthController.updateUser
);

/**
 * @swagger
 * /api/auth/users/{userId}/toggle-status:
 *   patch:
 *     summary: Toggle user active status (Admin only)
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 64a5b2c3d4e5f6789012345
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions (Admin only)
 */
router.patch('/users/:userId/toggle-status', 
  requireAdmin,
  requireAdmin,
  AuthController.toggleUserStatus
);

/**
 * @swagger
 * /api/auth/users/{userId}/reset-password:
 *   patch:
 *     summary: Reset user password (Admin only)
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions (Admin only)
 */
router.patch('/users/:userId/reset-password', [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], 
  requireAdmin,
  requireAdmin,
  AuthController.resetUserPassword
);

router.delete('/users/:userId', 
  requireAdmin,
  requireAdmin,
  AuthController.deleteUser
);

// =============================================================================
// ROLE & PERMISSION MANAGEMENT (Admin Only)
// =============================================================================

/**
 * @swagger
 * /api/auth/roles-permissions:
 *   get:
 *     summary: Get all available roles and permissions (Admin/Manager only)
 *     tags: [Roles, Permissions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Roles and permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Admin", "Manager", "Cashier", "Viewer"]
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["users:read", "users:write", "products:read", "sales:read"]
 *                     rolePermissions:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           type: string
 *                       example:
 *                         Admin: ["all"]
 *                         Manager: ["users:read", "products:write", "sales:read"]
 *                         Cashier: ["products:read", "sales:write"]
 *       403:
 *         description: Insufficient permissions
 */
router.get('/roles-permissions', 
  requireRole(['Admin', 'Manager']),
  requireAdmin,
  AuthController.getRolesAndPermissions
);

/**
 * @swagger
 * /api/auth/users/{userId}/permissions:
 *   patch:
 *     summary: Update user permissions (Admin only)
 *     tags: [User Management, Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["users:read", "products:write", "sales:read"]
 *     responses:
 *       200:
 *         description: User permissions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User permissions updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions (Admin only)
 */
router.patch('/users/:userId/permissions', [
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .isString()
    .withMessage('Each permission must be a string')
], 
  requireAdmin,
  requireAdmin,
  AuthController.updateUserPermissions
);

// =============================================================================
// AUDIT & SECURITY LOGS (Admin Only)
// =============================================================================

/**
 * @swagger
 * /api/auth/activity-logs:
 *   get:
 *     summary: Get user activity logs (Admin only)
 *     tags: [Audit, Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         format: objectId
 *                       userId:
 *                         type: string
 *                         format: objectId
 *                       action:
 *                         type: string
 *                         example: login
 *                       details:
 *                         type: object
 *                       ipAddress:
 *                         type: string
 *                         example: 192.168.1.1
 *                       userAgent:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       403:
 *         description: Insufficient permissions (Admin only)
 */
router.get('/activity-logs', 
  requireAdmin,
  requireAdmin,
  AuthController.getActivityLogs
);

/**
 * @swagger
 * /api/auth/users/{userId}/login-history:
 *   get:
 *     summary: Get login history for specific user (Admin/Manager only)
 *     tags: [Audit, User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of login records per page
 *     responses:
 *       200:
 *         description: Login history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       ipAddress:
 *                         type: string
 *                         example: 192.168.1.1
 *                       userAgent:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       location:
 *                         type: string
 *                         example: New York, US
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users/:userId/login-history', 
  requireRole(['Admin', 'Manager']),
  requireAdmin,
  AuthController.getUserLoginHistory
);

/**
 * @swagger
 * /api/auth/users/{userId}/force-logout:
 *   post:
 *     summary: Force user logout (Admin only)
 *     tags: [User Management, Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User logged out from all sessions successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions (Admin only)
 */
router.post('/users/:userId/force-logout', 
  requireAdmin,
  authenticateToken,
  AuthController.forceUserLogout
);

module.exports = router;
