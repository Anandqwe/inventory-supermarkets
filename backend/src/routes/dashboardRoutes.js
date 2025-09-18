/**
 * Dashboard Routes
 */
const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard routes
router.get('/overview', DashboardController.getDashboardOverview);
router.get('/sales-chart', DashboardController.getSalesChartData);
router.get('/inventory-analytics', DashboardController.getInventoryAnalytics);
router.get('/alerts', DashboardController.getAlerts);

module.exports = router;
