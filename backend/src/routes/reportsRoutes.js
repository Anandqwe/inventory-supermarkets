/**
 * Reports Routes
 */
const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Reports routes
router.get('/daily', ReportsController.getDailyReport);
router.get('/daterange', ReportsController.getDateRangeReport);
router.get('/products', ReportsController.getProductReport);

module.exports = router;