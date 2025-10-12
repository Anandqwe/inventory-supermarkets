const { body } = require('express-validator');

/**
 * Authentication-specific validation rules using express-validator
 */

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn(['admin', 'manager', 'cashier', 'viewer'])
    .withMessage('Role must be one of: admin, manager, cashier, viewer'),

  body('branch')
    .optional()
    .isMongoId()
    .withMessage('Branch must be a valid ID'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      const validPermissions = [
        'manage_users', 'view_users',
        'manage_products', 'view_products',
        'make_sales', 'view_sales',
        'manage_inventory', 'view_inventory',
        'view_reports', 'export_data',
        'manage_settings'
      ];

      if (!permissions.every(permission => validPermissions.includes(permission))) {
        throw new Error('Invalid permission provided');
      }
      return true;
    })
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

module.exports = {
  loginValidation,
  registerValidation,
  updateProfileValidation,
  changePasswordValidation,
  refreshTokenValidation
};
