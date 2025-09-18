const { body } = require('express-validator');

/**
 * Validation rules for Master Data operations
 */

// ============ CATEGORY VALIDATIONS ============

const categoryValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .notEmpty()
      .withMessage('Category code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Category code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Category code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],

  update: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Category code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Category code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    
    body('parentCategory')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ]
};

// ============ BRAND VALIDATIONS ============

const brandValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Brand name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Brand name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .notEmpty()
      .withMessage('Brand code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Brand code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Brand code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    
    body('website')
      .optional()
      .isURL()
      .withMessage('Invalid website URL')
      .trim(),
    
    body('logo')
      .optional()
      .isURL()
      .withMessage('Invalid logo URL')
      .trim(),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  update: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Brand name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Brand code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Brand code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    
    body('website')
      .optional()
      .isURL()
      .withMessage('Invalid website URL')
      .trim(),
    
    body('logo')
      .optional()
      .isURL()
      .withMessage('Invalid logo URL')
      .trim(),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ]
};

// ============ UNIT VALIDATIONS ============

const unitValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Unit name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Unit name must be between 2-50 characters')
      .trim(),
    
    body('symbol')
      .notEmpty()
      .withMessage('Unit symbol is required')
      .isLength({ min: 1, max: 10 })
      .withMessage('Unit symbol must be between 1-10 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Description must not exceed 200 characters')
      .trim(),
    
    body('unitType')
      .notEmpty()
      .withMessage('Unit type is required')
      .isIn(['weight', 'volume', 'length', 'area', 'count', 'time', 'other'])
      .withMessage('Invalid unit type'),
    
    body('conversionFactor')
      .optional()
      .isFloat({ min: 0.001 })
      .withMessage('Conversion factor must be a positive number'),
    
    body('baseUnit')
      .optional()
      .isMongoId()
      .withMessage('Invalid base unit ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  update: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Unit name must be between 2-50 characters')
      .trim(),
    
    body('symbol')
      .optional()
      .isLength({ min: 1, max: 10 })
      .withMessage('Unit symbol must be between 1-10 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Description must not exceed 200 characters')
      .trim(),
    
    body('unitType')
      .optional()
      .isIn(['weight', 'volume', 'length', 'area', 'count', 'time', 'other'])
      .withMessage('Invalid unit type'),
    
    body('conversionFactor')
      .optional()
      .isFloat({ min: 0.001 })
      .withMessage('Conversion factor must be a positive number'),
    
    body('baseUnit')
      .optional()
      .isMongoId()
      .withMessage('Invalid base unit ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ]
};

// ============ SUPPLIER VALIDATIONS ============

const supplierValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Supplier name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Supplier name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .notEmpty()
      .withMessage('Supplier code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Supplier code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Supplier code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    // Contact validations
    body('contact.personName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Contact person name must be between 2-100 characters')
      .trim(),
    
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('contact.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format'),
    
    body('contact.alternatePhone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid alternate phone number format'),
    
    body('contact.fax')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Fax number must not exceed 20 characters'),
    
    // Address validations
    body('address.street')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Street address must not exceed 200 characters')
      .trim(),
    
    body('address.city')
      .optional()
      .isLength({ max: 50 })
      .withMessage('City must not exceed 50 characters')
      .trim(),
    
    body('address.state')
      .optional()
      .isLength({ max: 50 })
      .withMessage('State must not exceed 50 characters')
      .trim(),
    
    body('address.country')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Country must not exceed 50 characters')
      .trim(),
    
    body('address.zipCode')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Zip code must not exceed 10 characters')
      .trim(),
    
    // Payment terms validations
    body('paymentTerms.creditDays')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Credit days must be between 0-365'),
    
    body('paymentTerms.creditLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Credit limit must be a non-negative number'),
    
    body('paymentTerms.paymentMethod')
      .optional()
      .isIn(['cash', 'credit', 'cheque', 'bank_transfer', 'online'])
      .withMessage('Invalid payment method'),
    
    // Tax info validations
    body('taxInfo.taxNumber')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Tax number must not exceed 50 characters')
      .trim(),
    
    body('taxInfo.gstNumber')
      .optional()
      .isLength({ max: 15 })
      .withMessage('GST number must not exceed 15 characters')
      .trim(),
    
    body('taxInfo.panNumber')
      .optional()
      .isLength({ max: 10 })
      .withMessage('PAN number must not exceed 10 characters')
      .trim(),
    
    // Bank details validations
    body('bankDetails.bankName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Bank name must not exceed 100 characters')
      .trim(),
    
    body('bankDetails.accountNumber')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Account number must not exceed 20 characters')
      .trim(),
    
    body('bankDetails.routingNumber')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Routing number must not exceed 20 characters')
      .trim(),
    
    body('bankDetails.swiftCode')
      .optional()
      .isLength({ max: 15 })
      .withMessage('SWIFT code must not exceed 15 characters')
      .trim(),
    
    body('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    
    body('categories.*')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  update: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Supplier name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Supplier code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Supplier code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    // Contact validations (same as create but all optional)
    body('contact.personName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Contact person name must be between 2-100 characters')
      .trim(),
    
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('contact.phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format'),
    
    body('contact.alternatePhone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid alternate phone number format'),
    
    body('contact.fax')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Fax number must not exceed 20 characters'),
    
    // Address validations (same as create but all optional)
    body('address.street')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Street address must not exceed 200 characters')
      .trim(),
    
    body('address.city')
      .optional()
      .isLength({ max: 50 })
      .withMessage('City must not exceed 50 characters')
      .trim(),
    
    body('address.state')
      .optional()
      .isLength({ max: 50 })
      .withMessage('State must not exceed 50 characters')
      .trim(),
    
    body('address.country')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Country must not exceed 50 characters')
      .trim(),
    
    body('address.zipCode')
      .optional()
      .isLength({ max: 10 })
      .withMessage('Zip code must not exceed 10 characters')
      .trim(),
    
    // Payment terms validations (same as create but all optional)
    body('paymentTerms.creditDays')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Credit days must be between 0-365'),
    
    body('paymentTerms.creditLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Credit limit must be a non-negative number'),
    
    body('paymentTerms.paymentMethod')
      .optional()
      .isIn(['cash', 'credit', 'cheque', 'bank_transfer', 'online'])
      .withMessage('Invalid payment method'),
    
    // Tax info validations (same as create but all optional)
    body('taxInfo.taxNumber')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Tax number must not exceed 50 characters')
      .trim(),
    
    body('taxInfo.gstNumber')
      .optional()
      .isLength({ max: 15 })
      .withMessage('GST number must not exceed 15 characters')
      .trim(),
    
    body('taxInfo.panNumber')
      .optional()
      .isLength({ max: 10 })
      .withMessage('PAN number must not exceed 10 characters')
      .trim(),
    
    // Bank details validations (same as create but all optional)
    body('bankDetails.bankName')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Bank name must not exceed 100 characters')
      .trim(),
    
    body('bankDetails.accountNumber')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Account number must not exceed 20 characters')
      .trim(),
    
    body('bankDetails.routingNumber')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Routing number must not exceed 20 characters')
      .trim(),
    
    body('bankDetails.swiftCode')
      .optional()
      .isLength({ max: 15 })
      .withMessage('SWIFT code must not exceed 15 characters')
      .trim(),
    
    body('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    
    body('categories.*')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ]
};

// ============ BRANCH VALIDATIONS ============

const branchValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Branch name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Branch name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .notEmpty()
      .withMessage('Branch code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Branch code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Branch code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('address')
      .notEmpty()
      .withMessage('Branch address is required')
      .isLength({ min: 10, max: 300 })
      .withMessage('Address must be between 10-300 characters')
      .trim(),
    
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .isMobilePhone()
      .withMessage('Invalid phone number format'),
    
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('manager')
      .optional()
      .isMongoId()
      .withMessage('Invalid manager user ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  update: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Branch name must be between 2-100 characters')
      .trim(),
    
    body('code')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('Branch code must be between 2-20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('Branch code must contain only uppercase letters, numbers, underscores, and hyphens')
      .trim(),
    
    body('address')
      .optional()
      .isLength({ min: 10, max: 300 })
      .withMessage('Address must be between 10-300 characters')
      .trim(),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number format'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('manager')
      .optional()
      .isMongoId()
      .withMessage('Invalid manager user ID'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ]
};

module.exports = {
  categoryValidation,
  brandValidation,
  unitValidation,
  supplierValidation,
  branchValidation
};