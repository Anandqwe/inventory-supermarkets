/**
 * Request validation helpers shared across controllers
 */
const ValidationUtils = require('./validationUtils');
const {
  hasAnyPermission: sharedHasAnyPermission,
  hasAllPermissions: sharedHasAllPermissions
} = require('../../../shared/permissions');

const flattenToArray = (value) => {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenToArray(item));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === 'object' && value._id) {
    return [String(value._id)];
  }

  return [String(value).trim()];
};

const toUniqueObjectIdStrings = (input) => {
  const seen = new Set();
  const values = flattenToArray(input)
    .map((item) => String(item).trim())
    .filter(Boolean);

  const unique = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      unique.push(value);
    }
  }

  return unique;
};

const validateObjectIdArray = (input) => {
  const ids = toUniqueObjectIdStrings(input);
  const invalid = ids.filter((id) => !ValidationUtils.isValidObjectId(id));
  const valid = ids.filter((id) => ValidationUtils.isValidObjectId(id));

  return { valid, invalid };
};

const ensureBranchIds = (input, { allowEmpty = false } = {}) => {
  const { valid, invalid } = validateObjectIdArray(input);

  if (invalid.length > 0) {
    return {
      isValid: false,
      branchIds: valid,
      invalidIds: invalid,
      message: 'Invalid branch identifier provided'
    };
  }

  if (!allowEmpty && valid.length === 0) {
    return {
      isValid: false,
      branchIds: valid,
      invalidIds: [],
      message: 'Branch selection is required'
    };
  }

  return {
    isValid: true,
    branchIds: valid,
    invalidIds: []
  };
};

const normalizePermissionInput = (permissions) => {
  if (!permissions) {
    return [];
  }

  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list
    .map((permission) => (permission ? String(permission).trim() : ''))
    .filter(Boolean);
};

const ensureUserHasPermissions = (user, permissions, { requireAll = true } = {}) => {
  const requiredPermissions = normalizePermissionInput(permissions);

  if (requiredPermissions.length === 0) {
    return {
      isValid: true,
      missing: []
    };
  }

  if (!user) {
    return {
      isValid: false,
      missing: requiredPermissions
    };
  }

  if (user.role === 'Admin') {
    return {
      isValid: true,
      missing: []
    };
  }

  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

  if (requireAll) {
    const missing = requiredPermissions.filter(
      (permission) => !sharedHasAllPermissions(userPermissions, [permission])
    );

    return {
      isValid: missing.length === 0,
      missing
    };
  }

  const hasAny = sharedHasAnyPermission(userPermissions, requiredPermissions);

  return {
    isValid: hasAny,
    missing: hasAny ? [] : requiredPermissions
  };
};

module.exports = {
  validateObjectIdArray,
  ensureBranchIds,
  normalizePermissionInput,
  ensureUserHasPermissions
};
