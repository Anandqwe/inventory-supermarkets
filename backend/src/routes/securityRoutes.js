const express = require('express');
const router = express.Router();

// Controllers
const SecurityController = require('../controllers/securityController');

// Middleware
const { authenticateToken, requirePermission } = require('../middleware/auth');

/**
 * Security Monitoring Routes
 * Provides access to audit logs and security analytics
 */

/**
 * @route   GET /api/security/audit-logs
 * @desc    Get audit logs with filtering
 * @access  Private (requires 'view_audit_logs' permission)
 * @query   page, limit, userId, action, resourceType, status, riskLevel, startDate, endDate, ipAddress, branchId
 */
router.get('/audit-logs',
  authenticateToken,
  requirePermission('view_audit_logs'),
  SecurityController.getAuditLogs
);

/**
 * @route   GET /api/security/dashboard
 * @desc    Get security dashboard analytics
 * @access  Private (requires 'view_security_dashboard' permission)
 * @query   days
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('view_security_dashboard'),
  SecurityController.getSecurityDashboard
);

/**
 * @route   GET /api/security/user-activity/:userId
 * @desc    Get user activity summary
 * @access  Private (users can view own activity, admins can view any)
 * @query   days
 */
router.get('/user-activity/:userId',
  authenticateToken,
  SecurityController.getUserActivity
);

/**
 * @route   GET /api/security/suspicious-activity
 * @desc    Detect suspicious activity patterns
 * @access  Private (requires 'view_security_dashboard' permission)
 * @query   timeWindow, failureThreshold, ipAddress, userId
 */
router.get('/suspicious-activity',
  authenticateToken,
  requirePermission('view_security_dashboard'),
  SecurityController.detectSuspiciousActivity
);

/**
 * @route   GET /api/security/login-attempts
 * @desc    Get login attempts summary
 * @access  Private (requires 'view_security_dashboard' permission)
 * @query   days
 */
router.get('/login-attempts',
  authenticateToken,
  requirePermission('view_security_dashboard'),
  SecurityController.getLoginAttempts
);

/**
 * @route   GET /api/security/export/audit-logs
 * @desc    Export audit logs (Admin only)
 * @access  Private (Admin only)
 * @query   format, startDate, endDate, userId, action, riskLevel
 */
router.get('/export/audit-logs',
  authenticateToken,
  SecurityController.exportAuditLogs
);

module.exports = router;
