const SystemSettings = require('../models/SystemSettings');
const ResponseUtils = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');

class SystemSettingsController {
  /**
   * Get system settings
   */
  static getSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getSettings();
    ResponseUtils.success(res, settings, 'System settings retrieved successfully');
  });

  /**
   * Update system settings (Admin only)
   */
  static updateSettings = asyncHandler(async (req, res) => {
    // Only admins can update system settings
    if (req.user.role !== 'Admin') {
      return ResponseUtils.error(res, 'Only administrators can update system settings', 403);
    }

    const {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyWebsite,
      taxId,
      currency,
      defaultGstRate,
      lowStockThreshold,
      receiptFooter
    } = req.body;

    const updates = {};
    if (companyName !== undefined) updates.companyName = companyName;
    if (companyAddress !== undefined) updates.companyAddress = companyAddress;
    if (companyPhone !== undefined) updates.companyPhone = companyPhone;
    if (companyEmail !== undefined) updates.companyEmail = companyEmail;
    if (companyWebsite !== undefined) updates.companyWebsite = companyWebsite;
    if (taxId !== undefined) updates.taxId = taxId;
    if (currency !== undefined) {
      if (!['INR', 'USD', 'EUR', 'GBP'].includes(currency)) {
        return ResponseUtils.error(res, 'Invalid currency', 400);
      }
      updates.currency = currency;
    }
    if (defaultGstRate !== undefined) {
      if (defaultGstRate < 0 || defaultGstRate > 100) {
        return ResponseUtils.error(res, 'GST rate must be between 0 and 100', 400);
      }
      updates.defaultGstRate = defaultGstRate;
    }
    if (lowStockThreshold !== undefined) {
      if (lowStockThreshold < 1) {
        return ResponseUtils.error(res, 'Low stock threshold must be at least 1', 400);
      }
      updates.lowStockThreshold = lowStockThreshold;
    }
    if (receiptFooter !== undefined) {
      if (receiptFooter.length > 100) {
        return ResponseUtils.error(res, 'Receipt footer must be 100 characters or less', 400);
      }
      updates.receiptFooter = receiptFooter;
    }

    const settings = await SystemSettings.updateSettings(updates, req.user.id);

    // Log the settings update (optional - can be added later)
    // await AuditLog.create({ ... });

    ResponseUtils.success(res, settings, 'System settings updated successfully');
  });
}

module.exports = SystemSettingsController;
