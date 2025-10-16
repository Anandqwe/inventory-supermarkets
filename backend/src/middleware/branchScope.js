/**
 * Middleware helpers for enforcing branch-scoped access
 */
const ResponseUtils = require('../utils/responseUtils');
const ValidationUtils = require('../utils/validationUtils');
const { hasCrossBranchAccess } = require('../../../shared/permissions');

const toIdString = (value) => {
  if (!value) {
    return null;
  }

  // Handle string values
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  // Handle ObjectId instances - convert directly to string
  if (value.constructor && (value.constructor.name === 'ObjectId' || value instanceof Object && value._bsontype === 'ObjectId')) {
    const str = value.toString();
    return str && str !== '[object Object]' ? str : null;
  }

  // Handle plain objects
  if (typeof value === 'object' && value !== null) {
    // Extract _id if it exists and it's NOT an ObjectId (to avoid infinite recursion)
    if (value._id && value._id !== value) {
      return toIdString(value._id);
    }
    
    // Try toString only if it's a useful method
    if (typeof value.toString === 'function') {
      try {
        const str = value.toString();
        if (str && typeof str === 'string' && str !== '[object Object]' && str !== '[object]') {
          return str.trim() || null;
        }
      } catch (e) {
        // Ignore errors from toString()
      }
    }
  }

  return null;
};

const uniqueIds = (values) => {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const id = toIdString(value);
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  });

  return result;
};

const flattenBranchInput = (value) => {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenBranchInput(item));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [value];
};

const parseBranchIdsInput = (input) => uniqueIds(flattenBranchInput(input));

const validateBranchIds = (values) => {
  const normalized = parseBranchIdsInput(values);
  const invalidIds = normalized.filter((id) => !ValidationUtils.isValidObjectId(id));
  const validIds = normalized.filter((id) => ValidationUtils.isValidObjectId(id));

  return { validIds, invalidIds };
};

const getUserBranchId = (user = {}) => {
  if (!user || !user.branch) {
    return null;
  }

  return toIdString(user.branch);
};

const buildBranchFilter = (branchIds, field = 'branch') => {
  if (!Array.isArray(branchIds) || branchIds.length === 0) {
    return null;
  }

  if (branchIds.length === 1) {
    return { [field]: branchIds[0] };
  }

  return { [field]: { $in: branchIds } };
};

const resolveBranchIdsFromRequest = (req, options = {}) => {
  const {
    param = 'branchId',
    sources = ['query'],
    allowMultiple = false
  } = options;

  const rawValues = sources.flatMap((source) => {
    const container = req[source];
    if (!container || container[param] === undefined) {
      return [];
    }

    return Array.isArray(container[param]) ? container[param] : [container[param]];
  });

  const { validIds, invalidIds } = validateBranchIds(rawValues);
  const branchIds = allowMultiple ? validIds : validIds.slice(0, 1);

  return {
    branchIds,
    invalidIds
  };
};

const applyBranchScope = (options = {}) => {
  const normalizedOptions = typeof options === 'string' ? { field: options } : options || {};

  const {
    field = 'branch',
    param = 'branchId',
    sources = ['query'],
    allowMultiple = false,
    enforceForScopedRoles = true,
    attachProperty = 'branchFilter',
    attachResolved = 'resolvedBranchIds'
  } = normalizedOptions;

  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtils.unauthorized(res, 'Authentication required');
    }

    const userRole = req.user.role;
    const userBranchId = getUserBranchId(req.user);
    const isCrossBranchUser = hasCrossBranchAccess(userRole);

    const { branchIds, invalidIds } = resolveBranchIdsFromRequest(req, {
      param,
      sources,
      allowMultiple
    });

    if (invalidIds.length > 0) {
      return ResponseUtils.validationError(res, invalidIds.map((id) => ({
        path: param,
        message: 'Invalid branch identifier',
        value: id
      })));
    }

    let resolvedBranchIds = branchIds;

    if (!isCrossBranchUser) {
      if (!userBranchId) {
        return ResponseUtils.forbidden(res, 'Branch assignment required for this action');
      }

      if (resolvedBranchIds.length === 0) {
        resolvedBranchIds = [userBranchId];
      } else if (resolvedBranchIds.some((id) => id !== userBranchId)) {
        return ResponseUtils.forbidden(res, 'Cannot access other branches');
      }
    }

    if (isCrossBranchUser && resolvedBranchIds.length === 0 && enforceForScopedRoles) {
      resolvedBranchIds = [];
    }

    if (attachResolved) {
      req[attachResolved] = resolvedBranchIds;
    }

    if (attachProperty) {
      const filter = buildBranchFilter(resolvedBranchIds, field);
      if (filter) {
        req[attachProperty] = filter;
      } else if (req[attachProperty]) {
        delete req[attachProperty];
      }
    }

    return next();
  };
};

const assertBranchReadAccess = (branchId, user) => {
  if (!branchId || !user) {
    return false;
  }

  if (hasCrossBranchAccess(user.role)) {
    return true;
  }

  const userBranchId = getUserBranchId(user);
  const branchIds = Array.isArray(branchId) ? branchId : [branchId];

  return !!userBranchId && branchIds.every((id) => userBranchId === toIdString(id));
};

const assertBranchWriteAccess = (branchId, user) => {
  if (!branchId || !user) {
    return false;
  }

  if (hasCrossBranchAccess(user.role)) {
    return true;
  }

  const userBranchId = getUserBranchId(user);
  const branchIds = Array.isArray(branchId) ? branchId : [branchId];

  return !!userBranchId && branchIds.every((id) => userBranchId === toIdString(id));
};

module.exports = {
  applyBranchScope,
  resolveBranchIdsFromRequest,
  buildBranchFilter,
  validateBranchIds,
  parseBranchIdsInput,
  getUserBranchId,
  assertBranchReadAccess,
  assertBranchWriteAccess
};
