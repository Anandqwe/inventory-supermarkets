const express = require('express');
const router = express.Router();
const SystemSettingsController = require('../controllers/systemSettingsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// System settings routes
router.get('/', SystemSettingsController.getSettings);
router.put('/', SystemSettingsController.updateSettings);

module.exports = router;
