/**
 * Centralized Permission Constants
 * Single source of truth for all permission strings across frontend and backend
 */

const normalizeRoleName = (value) => {
  if (!value) {
    return value;
  }

  const role = String(value).trim().toLowerCase();

  switch (role) {
    case 'admin':
      return 'Admin';
    case 'regional manager':
    case 'regional_manager':
    case 'regional-manager':
      return 'Regional Manager';
    case 'store manager':
    case 'store_manager':
    case 'store-manager':
    case 'manager':
      return 'Store Manager';
    case 'inventory manager':
    case 'inventory_manager':
    case 'inventory-manager':
      return 'Inventory Manager';
    case 'cashier':
      return 'Cashier';
    case 'viewer':
    case 'auditor':
      return 'Viewer';
    default:
      return value;
  }
};

const PERMISSIONS = Object.freeze({
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
  },

  PRODUCTS: {
    CREATE: 'products.create',
    READ: 'products.read',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
    IMPORT: 'products.import',
    EXPORT: 'products.export',
  },

  SALES: {
    CREATE: 'sales.create',
    READ: 'sales.read',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    REFUND: 'sales.refund',
  },

  INVENTORY: {
    CREATE: 'inventory.create',
    READ: 'inventory.read',
    UPDATE: 'inventory.update',
    DELETE: 'inventory.delete',
    ADJUST: 'inventory.adjust',
    TRANSFER: 'inventory.transfer',
  },

  PURCHASES: {
    CREATE: 'purchases.create',
    READ: 'purchases.read',
    UPDATE: 'purchases.update',
    DELETE: 'purchases.delete',
    APPROVE: 'purchases.approve',
    RECEIVE: 'purchases.receive',
  },

  INVOICES: {
    CREATE: 'invoices.create',
    READ: 'invoices.read',
    UPDATE: 'invoices.update',
    DELETE: 'invoices.delete',
    VOID: 'invoices.void',
    SEND: 'invoices.send',
  },

  PAYMENTS: {
    CREATE: 'payments.create',
    READ: 'payments.read',
    UPDATE: 'payments.update',
    VOID: 'payments.void',
  },

  FINANCIAL: {
    REPORTS: 'financial.reports',
    DASHBOARD: 'financial.dashboard',
  },

  REPORTS: {
    READ: 'reports.read',
    EXPORT: 'reports.export',
    ANALYTICS: 'reports.analytics',
  },

  CATEGORIES: {
    CREATE: 'categories.create',
    READ: 'categories.read',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete',
  },

  BRANDS: {
    CREATE: 'brands.create',
    READ: 'brands.read',
    UPDATE: 'brands.update',
    DELETE: 'brands.delete',
  },

  UNITS: {
    CREATE: 'units.create',
    READ: 'units.read',
    UPDATE: 'units.update',
    DELETE: 'units.delete',
  },

  SUPPLIERS: {
    CREATE: 'suppliers.create',
    READ: 'suppliers.read',
    UPDATE: 'suppliers.update',
    DELETE: 'suppliers.delete',
  },

  CUSTOMERS: {
    CREATE: 'customers.create',
    READ: 'customers.read',
    UPDATE: 'customers.update',
    DELETE: 'customers.delete',
    EXPORT: 'customers.export',
  },

  BRANCHES: {
    CREATE: 'branches.create',
    READ: 'branches.read',
    UPDATE: 'branches.update',
    DELETE: 'branches.delete',
  },

  AUDIT: {
    READ: 'audit.read',
  },

  SECURITY: {
    DASHBOARD: 'security.dashboard',
    SESSIONS: 'security.sessions',
  },

  DASHBOARD: {
    READ: 'dashboard.read',
    ANALYTICS: 'dashboard.analytics',
  },

  PROFILE: {
    READ: 'profile.read',
    UPDATE: 'profile.update',
  },
});

const flattenPermissions = (group) => Object.values(group).flatMap((value) => {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object') {
    return Object.values(value);
  }
  return [];
});

const ALL_PERMISSIONS = Array.from(new Set(flattenPermissions(PERMISSIONS)));

const normalizePermission = (value) => {
  if (!value) {
    return '';
  }

  return String(value).trim();
};

const toPermissionArray = (permissions) => {
  if (!permissions) {
    return [];
  }

  if (Array.isArray(permissions)) {
    return Array.from(new Set(permissions.map(normalizePermission).filter(Boolean)));
  }

  if (typeof permissions === 'object') {
    return Object.entries(permissions).flatMap(([resource, actions]) => {
      if (!Array.isArray(actions)) {
        return [];
      }

      return actions
        .map((action) => normalizePermission(`${resource}.${action}`))
        .filter(Boolean);
    });
  }

  return [];
};

const hasPermission = (permissions, requiredPermission) => {
  const normalizedRequired = normalizePermission(requiredPermission);
  if (!normalizedRequired) {
    return false;
  }

  const normalizedPermissions = toPermissionArray(permissions);
  if (normalizedPermissions.includes(normalizedRequired)) {
    return true;
  }

  const [resource, action] = normalizedRequired.split('.');
  if (!resource) {
    return false;
  }

  const wildcardDot = `${resource}.*`;
  const wildcardColon = `${resource}:*`;
  const colonPermission = action ? `${resource}:${action}` : '';

  return (
    normalizedPermissions.includes(wildcardDot) ||
    normalizedPermissions.includes(wildcardColon) ||
    (colonPermission && normalizedPermissions.includes(colonPermission))
  );
};

const hasAnyPermission = (permissions, requiredPermissions = []) => {
  const list = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return list.some((permission) => hasPermission(permissions, permission));
};

const hasAllPermissions = (permissions, requiredPermissions = []) => {
  const list = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  if (list.length === 0) {
    return true;
  }

  return list.every((permission) => hasPermission(permissions, permission));
};

const BRANCH_SCOPED_ROLES = Object.freeze([
  'Store Manager',
  'Inventory Manager',
  'Cashier',
]);

const CROSS_BRANCH_ROLES = Object.freeze([
  'Admin',
  'Regional Manager',
  'Viewer',
]);

const ROLE_PERMISSIONS = Object.freeze({
  Admin: [...ALL_PERMISSIONS],

  'Regional Manager': Object.freeze([
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,

    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.UPDATE,
    PERMISSIONS.PRODUCTS.DELETE,
    PERMISSIONS.PRODUCTS.IMPORT,
    PERMISSIONS.PRODUCTS.EXPORT,

    PERMISSIONS.SALES.CREATE,
    PERMISSIONS.SALES.READ,
    PERMISSIONS.SALES.UPDATE,
    PERMISSIONS.SALES.REFUND,

    PERMISSIONS.INVENTORY.CREATE,
    PERMISSIONS.INVENTORY.READ,
    PERMISSIONS.INVENTORY.UPDATE,
    PERMISSIONS.INVENTORY.ADJUST,
    PERMISSIONS.INVENTORY.TRANSFER,

    PERMISSIONS.PURCHASES.CREATE,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.UPDATE,
    PERMISSIONS.PURCHASES.APPROVE,
    PERMISSIONS.PURCHASES.RECEIVE,

    PERMISSIONS.INVOICES.READ,
    PERMISSIONS.PAYMENTS.READ,
    PERMISSIONS.FINANCIAL.REPORTS,
    PERMISSIONS.FINANCIAL.DASHBOARD,

    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.EXPORT,
    PERMISSIONS.REPORTS.ANALYTICS,

    PERMISSIONS.CATEGORIES.READ,
    PERMISSIONS.CATEGORIES.UPDATE,
    PERMISSIONS.BRANDS.READ,
    PERMISSIONS.BRANDS.UPDATE,
    PERMISSIONS.UNITS.READ,
    PERMISSIONS.SUPPLIERS.READ,
    PERMISSIONS.SUPPLIERS.UPDATE,
  PERMISSIONS.CUSTOMERS.READ,
  PERMISSIONS.CUSTOMERS.UPDATE,
  PERMISSIONS.CUSTOMERS.EXPORT,
    PERMISSIONS.BRANCHES.READ,

    PERMISSIONS.AUDIT.READ,

    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.DASHBOARD.ANALYTICS,

    PERMISSIONS.PROFILE.READ,
    PERMISSIONS.PROFILE.UPDATE,
  ]),

  'Store Manager': Object.freeze([
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,

    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.UPDATE,
    PERMISSIONS.PRODUCTS.IMPORT,
    PERMISSIONS.PRODUCTS.EXPORT,

    PERMISSIONS.SALES.CREATE,
    PERMISSIONS.SALES.READ,
    PERMISSIONS.SALES.UPDATE,
    PERMISSIONS.SALES.REFUND,

    PERMISSIONS.INVENTORY.CREATE,
    PERMISSIONS.INVENTORY.READ,
    PERMISSIONS.INVENTORY.UPDATE,
    PERMISSIONS.INVENTORY.ADJUST,
    PERMISSIONS.INVENTORY.TRANSFER,

    PERMISSIONS.PURCHASES.CREATE,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.UPDATE,
    PERMISSIONS.PURCHASES.APPROVE,
    PERMISSIONS.PURCHASES.RECEIVE,

    PERMISSIONS.INVOICES.CREATE,
    PERMISSIONS.INVOICES.READ,
    PERMISSIONS.INVOICES.UPDATE,
    PERMISSIONS.INVOICES.SEND,

    PERMISSIONS.PAYMENTS.CREATE,
    PERMISSIONS.PAYMENTS.READ,
    PERMISSIONS.FINANCIAL.REPORTS,
    PERMISSIONS.FINANCIAL.DASHBOARD,

    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.EXPORT,
    PERMISSIONS.REPORTS.ANALYTICS,

    PERMISSIONS.CATEGORIES.READ,
    PERMISSIONS.BRANDS.READ,
    PERMISSIONS.UNITS.READ,
    PERMISSIONS.SUPPLIERS.READ,
  PERMISSIONS.CUSTOMERS.CREATE,
  PERMISSIONS.CUSTOMERS.READ,
  PERMISSIONS.CUSTOMERS.UPDATE,
    PERMISSIONS.BRANCHES.READ,

    PERMISSIONS.AUDIT.READ,

    PERMISSIONS.DASHBOARD.READ,
    PERMISSIONS.DASHBOARD.ANALYTICS,

    PERMISSIONS.PROFILE.READ,
    PERMISSIONS.PROFILE.UPDATE,
  ]),

  'Inventory Manager': Object.freeze([
    // Users (read only)
    PERMISSIONS.USERS.READ,
    
    // Products
    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.UPDATE,
    PERMISSIONS.PRODUCTS.DELETE,
    PERMISSIONS.PRODUCTS.EXPORT,
    PERMISSIONS.PRODUCTS.IMPORT,
    
    // Sales (read only for reconciliation)
    PERMISSIONS.SALES.READ,
    
    // Inventory (full access)
    PERMISSIONS.INVENTORY.CREATE,
    PERMISSIONS.INVENTORY.READ,
    PERMISSIONS.INVENTORY.UPDATE,
    PERMISSIONS.INVENTORY.DELETE,
    PERMISSIONS.INVENTORY.ADJUST,
    PERMISSIONS.INVENTORY.TRANSFER,
    
    // Purchases
    PERMISSIONS.PURCHASES.CREATE,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.RECEIVE,
    
    // Financial (purchase-related only)
    PERMISSIONS.INVOICES.READ,
    
    // Reports (inventory focused)
    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.EXPORT,
    
    // Master Data
    PERMISSIONS.CATEGORIES.READ,
    PERMISSIONS.BRANDS.READ,
    PERMISSIONS.UNITS.READ,
    PERMISSIONS.SUPPLIERS.READ,
  PERMISSIONS.CUSTOMERS.READ,
  PERMISSIONS.CUSTOMERS.UPDATE,
    PERMISSIONS.BRANCHES.READ,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.READ,
    
    // Profile
    PERMISSIONS.PROFILE.READ,
    PERMISSIONS.PROFILE.UPDATE,
  ]),

  Cashier: Object.freeze([
    // Products (read for sales - can see stock levels in product details)
    PERMISSIONS.PRODUCTS.READ,
    
    // Sales (create and view own)
    PERMISSIONS.SALES.CREATE,
    PERMISSIONS.SALES.READ,
    
    // Master Data (read for product lookup)
    PERMISSIONS.CATEGORIES.READ,
    PERMISSIONS.BRANDS.READ,
    
    // Dashboard (personal metrics)
    PERMISSIONS.DASHBOARD.READ,
    
    // Profile
    PERMISSIONS.PROFILE.READ,
    PERMISSIONS.PROFILE.UPDATE,
  ]),

  Viewer: Object.freeze([
    // Products
    PERMISSIONS.PRODUCTS.READ,
    
    // Sales
    PERMISSIONS.SALES.READ,
    
    // Inventory
    PERMISSIONS.INVENTORY.READ,
    
    // Purchases
    PERMISSIONS.PURCHASES.READ,
    
    // Financial
    PERMISSIONS.INVOICES.READ,
    PERMISSIONS.PAYMENTS.READ,
    PERMISSIONS.FINANCIAL.REPORTS,
    
    // Reports
    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.EXPORT,
    
    // Master Data
    PERMISSIONS.CATEGORIES.READ,
    PERMISSIONS.BRANDS.READ,
    PERMISSIONS.UNITS.READ,
    PERMISSIONS.SUPPLIERS.READ,
  PERMISSIONS.CUSTOMERS.READ,
    PERMISSIONS.BRANCHES.READ,
    
    // Dashboard
    PERMISSIONS.DASHBOARD.READ,

    PERMISSIONS.PROFILE.READ,
  ]),
});

const getAllPermissions = () => [...ALL_PERMISSIONS];

const getRolePermissions = (role) => {
  const normalizedRole = normalizeRoleName(role);
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  return permissions ? [...permissions] : [];
};

const isBranchScopedRole = (role) => BRANCH_SCOPED_ROLES.includes(normalizeRoleName(role));

const hasCrossBranchAccess = (role) => CROSS_BRANCH_ROLES.includes(normalizeRoleName(role));

// Export for CommonJS (Node.js backend) and provide interop for ESM bundlers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PERMISSIONS,
    ALL_PERMISSIONS,
    ROLE_PERMISSIONS,
    BRANCH_SCOPED_ROLES,
    CROSS_BRANCH_ROLES,
    getAllPermissions,
    getRolePermissions,
    isBranchScopedRole,
    hasCrossBranchAccess,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    toPermissionArray,
    normalizeRoleName,
  };

  module.exports.default = module.exports;
}

export {
  PERMISSIONS,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  BRANCH_SCOPED_ROLES,
  CROSS_BRANCH_ROLES,
  getAllPermissions,
  getRolePermissions,
  isBranchScopedRole,
  hasCrossBranchAccess,
  normalizeRoleName,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  toPermissionArray,
};
