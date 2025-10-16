const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: true,
    default: 'Mumbai Supermart'
  },
  companyAddress: {
    type: String,
    default: ''
  },
  companyPhone: {
    type: String,
    default: ''
  },
  companyEmail: {
    type: String,
    default: ''
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  taxId: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  // Business Settings
  defaultGstRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 1
  },
  receiptFooter: {
    type: String,
    default: 'Thank you for shopping with us! Visit again!',
    maxlength: 100
  },
  
  // Metadata
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists (singleton pattern)
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

systemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
  }
  settings.updatedBy = userId;
  await settings.save();
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
