/**
 * Authentication Routes
 */
const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile routes
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/change-password', AuthController.changePassword);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);

// Admin/Manager routes
router.post('/register', requireRole(['Admin', 'Regional Manager', 'Store Manager']), AuthController.register);
router.get('/users', requireRole(['Admin', 'Regional Manager', 'Store Manager']), AuthController.getAllUsers);
router.patch('/users/:userId/toggle-status', requireRole(['Admin', 'Regional Manager', 'Store Manager']), AuthController.toggleUserStatus);

module.exports = router;
