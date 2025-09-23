/**
 * Authentication Routes
 */
const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken, requireAdmin, requireManager } = require('../middleware/auth');
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
router.post('/register', requireManager, AuthController.register);
router.get('/users', requireManager, AuthController.getAllUsers);
router.patch('/users/:userId/toggle-status', requireAdmin, AuthController.toggleUserStatus);

module.exports = router;
