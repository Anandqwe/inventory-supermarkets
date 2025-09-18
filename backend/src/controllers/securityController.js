const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');

/**
 * Security Monitoring Controller
 * Provides endpoints for viewing audit logs and security analytics
 */
class SecurityController {
  
  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        action,
        resourceType,
        status,
        riskLevel,
        startDate,
        endDate,
        ipAddress,
        branchId
      } = req.query;

      // Build filter
      const filter = {};

      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (resourceType) filter.resourceType = resourceType;
      if (status) filter.status = status;
      if (riskLevel) filter.riskLevel = riskLevel;
      if (ipAddress) filter.ipAddress = ipAddress;
      if (branchId) filter.branchId = branchId;

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Branch access control
      if (req.user.role !== 'admin' && req.user.branch) {
        filter.branchId = req.user.branch._id;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [auditLogs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('userId', 'firstName lastName email')
          .populate('branchId', 'name code')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get security dashboard analytics
   */
  static async getSecurityDashboard(req, res) {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Build base filter
      const baseFilter = {
        createdAt: { $gte: startDate }
      };

      // Branch access control
      if (req.user.role !== 'admin' && req.user.branch) {
        baseFilter.branchId = req.user.branch._id;
      }

      // Get various analytics in parallel
      const [
        totalLogs,
        failureCount,
        securityEvents,
        riskDistribution,
        actionDistribution,
        userActivityTop,
        ipActivityTop,
        recentHighRisk
      ] = await Promise.all([
        // Total audit logs
        AuditLog.countDocuments(baseFilter),

        // Failure count
        AuditLog.countDocuments({
          ...baseFilter,
          status: 'failure'
        }),

        // Security events count
        AuditLog.countDocuments({
          ...baseFilter,
          $or: [
            { flags: 'suspicious_activity' },
            { riskLevel: 'critical' },
            { action: 'security_event' }
          ]
        }),

        // Risk level distribution
        AuditLog.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$riskLevel',
              count: { $sum: 1 }
            }
          }
        ]),

        // Action distribution
        AuditLog.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$action',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),

        // Top user activity
        AuditLog.aggregate([
          { $match: { ...baseFilter, userId: { $exists: true } } },
          {
            $group: {
              _id: '$userId',
              count: { $sum: 1 },
              lastActivity: { $max: '$createdAt' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          }
        ]),

        // Top IP activity
        AuditLog.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$ipAddress',
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: '$userId' },
              lastActivity: { $max: '$createdAt' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),

        // Recent high risk events
        AuditLog.find({
          ...baseFilter,
          riskLevel: { $in: ['high', 'critical'] }
        })
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
      ]);

      // Calculate trends
      const failureRate = totalLogs > 0 ? (failureCount / totalLogs * 100).toFixed(2) : 0;

      res.json({
        success: true,
        message: 'Security dashboard data retrieved successfully',
        data: {
          summary: {
            totalLogs,
            failureCount,
            failureRate: parseFloat(failureRate),
            securityEvents,
            period: `${days} days`
          },
          distributions: {
            riskLevels: riskDistribution,
            actions: actionDistribution
          },
          topActivity: {
            users: userActivityTop,
            ipAddresses: ipActivityTop
          },
          recentHighRiskEvents: recentHighRisk
        }
      });

    } catch (error) {
      console.error('Get security dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      // Check permissions - users can only view their own activity unless admin
      if (req.user.role !== 'admin' && req.user.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const activity = await AuditLog.getUserActivity(userId, parseInt(days));

      res.json({
        success: true,
        message: 'User activity retrieved successfully',
        data: activity
      });

    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(req, res) {
    try {
      const {
        timeWindow = 60,
        failureThreshold = 5,
        ipAddress,
        userId
      } = req.query;

      const suspiciousActivity = await AuditLog.detectSuspiciousActivity({
        timeWindow: parseInt(timeWindow),
        failureThreshold: parseInt(failureThreshold),
        ipAddress,
        userId
      });

      res.json({
        success: true,
        message: 'Suspicious activity check completed',
        data: suspiciousActivity
      });

    } catch (error) {
      console.error('Detect suspicious activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get login attempts summary
   */
  static async getLoginAttempts(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const baseFilter = {
        createdAt: { $gte: startDate },
        action: { $in: ['login', 'login_failed'] }
      };

      const [successful, failed, byIP, byHour] = await Promise.all([
        // Successful logins
        AuditLog.countDocuments({
          ...baseFilter,
          action: 'login',
          status: 'success'
        }),

        // Failed logins
        AuditLog.countDocuments({
          ...baseFilter,
          action: 'login_failed',
          status: 'failure'
        }),

        // Login attempts by IP
        AuditLog.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$ipAddress',
              successful: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$action', 'login'] }, { $eq: ['$status', 'success'] }] },
                    1,
                    0
                  ]
                }
              },
              failed: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$action', 'login_failed'] }, { $eq: ['$status', 'failure'] }] },
                    1,
                    0
                  ]
                }
              },
              total: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } },
          { $limit: 20 }
        ]),

        // Login attempts by hour
        AuditLog.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      res.json({
        success: true,
        message: 'Login attempts summary retrieved successfully',
        data: {
          summary: {
            successful,
            failed,
            total: successful + failed,
            successRate: successful + failed > 0 ? 
              ((successful / (successful + failed)) * 100).toFixed(2) : 0
          },
          byIP,
          byHour
        }
      });

    } catch (error) {
      console.error('Get login attempts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Export audit logs (Admin only)
   */
  static async exportAuditLogs(req, res) {
    try {
      // Only admins can export audit logs
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Admin access required'
        });
      }

      const {
        format = 'json',
        startDate,
        endDate,
        userId,
        action,
        riskLevel
      } = req.query;

      // Build filter
      const filter = {};

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      if (userId) filter.userId = userId;
      if (action) filter.action = action;
      if (riskLevel) filter.riskLevel = riskLevel;

      // Limit export size for security
      const maxRecords = 10000;
      const auditLogs = await AuditLog.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('branchId', 'name code')
        .sort({ createdAt: -1 })
        .limit(maxRecords)
        .lean();

      if (format === 'csv') {
        // Convert to CSV format
        const csv = convertToCSV(auditLogs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.send(csv);
      } else {
        // Return as JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
        res.json({
          success: true,
          message: 'Audit logs exported successfully',
          data: auditLogs,
          exportInfo: {
            totalRecords: auditLogs.length,
            maxRecords,
            exportDate: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      console.error('Export audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

/**
 * Convert audit logs to CSV format
 */
function convertToCSV(auditLogs) {
  const headers = [
    'Timestamp',
    'User Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Status',
    'Risk Level',
    'IP Address',
    'Description'
  ];

  const rows = auditLogs.map(log => [
    log.createdAt,
    log.userId?.email || 'System',
    log.action,
    log.resourceType,
    log.resourceId || '',
    log.status,
    log.riskLevel,
    log.ipAddress,
    log.description
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

module.exports = SecurityController;