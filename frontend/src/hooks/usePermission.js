import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../../../shared/permissions';

/**
 * Custom hook for checking user permissions on the frontend
 * Provides granular permission checking for UI elements
 * 
 * @example
 * const { hasPermission, canAccess } = usePermission();
 * 
 * {hasPermission(PERMISSIONS.PRODUCTS.CREATE) && (
 *   <Button onClick={handleCreate}>Create Product</Button>
 * )}
 */
export const usePermission = () => {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission string in dot notation (e.g., 'products.create')
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!user || !user.permissions) {
      return false;
    }

    // Admin has all permissions
    if (user.role === 'Admin') {
      return true;
    }

    // Check if permissions is an array
    if (Array.isArray(user.permissions)) {
      // Direct match
      if (user.permissions.includes(permission)) {
        return true;
      }

      // Check for wildcard permissions (e.g., 'products.*' grants all product permissions)
      const [resource] = permission.split('.');
      if (user.permissions.includes(`${resource}.*`)) {
        return true;
      }

      // Backward compatibility: Check colon notation (legacy format)
      const colonPermission = permission.replace('.', ':');
      if (user.permissions.includes(colonPermission)) {
        return true;
      }

      return false;
    }

    // Check nested permission structure (future support)
    if (typeof user.permissions === 'object' && permission.includes('.')) {
      const [resource, action] = permission.split('.');
      return user.permissions[resource] && user.permissions[resource].includes(action);
    }

    return false;
  };

  /**
   * Check if user has ANY of the specified permissions
   * @param {string[]} permissions - Array of permission strings
   * @returns {boolean}
   */
  const hasAnyPermission = (permissions) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }
    return permissions.some(p => hasPermission(p));
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param {string[]} permissions - Array of permission strings
   * @returns {boolean}
   */
  const hasAllPermissions = (permissions) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }
    return permissions.every(p => hasPermission(p));
  };

  /**
   * Check if user has a specific role
   * @param {string|string[]} roles - Role name(s) to check
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!user || !user.role) {
      return false;
    }

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  };

  /**
   * Check if user is Admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  /**
   * Check if user is any type of Manager
   * @returns {boolean}
   */
  const isManager = () => {
    return hasRole(['Admin', 'Regional Manager', 'Store Manager', 'Inventory Manager']);
  };

  /**
   * Check if user is Cashier
   * @returns {boolean}
   */
  const isCashier = () => {
    return user?.role === 'Cashier';
  };

  /**
   * Check if user is Viewer (read-only)
   * @returns {boolean}
   */
  const isViewer = () => {
    return user?.role === 'Viewer';
  };

  /**
   * Check if user can access a specific route based on common patterns
   * @param {string} route - Route path (e.g., '/products', '/sales')
   * @returns {boolean}
   */
  const canAccessRoute = (route) => {
    if (!user) {
      return false;
    }

    // Admin can access everything
    if (isAdmin()) {
      return true;
    }

    // Route to permission mapping
    const routePermissions = {
      '/': [PERMISSIONS.DASHBOARD.READ],
      '/dashboard': [PERMISSIONS.DASHBOARD.READ],
      '/products': [PERMISSIONS.PRODUCTS.READ],
      '/sales': [PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE],
      '/inventory': [PERMISSIONS.INVENTORY.READ],
      '/reports': [PERMISSIONS.REPORTS.READ],
      '/settings': [PERMISSIONS.PROFILE.READ],
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) {
      // If route is not in the map, allow access (permissive)
      return true;
    }

    return hasAnyPermission(requiredPermissions);
  };

  /**
   * Get user's full role display name
   * @returns {string}
   */
  const getRoleDisplay = () => {
    return user?.role || 'Unknown';
  };

  /**
   * Check if user belongs to assigned branch
   * @param {string} branchId - Branch ID to check
   * @returns {boolean}
   */
  const belongsToBranch = (branchId) => {
    if (!user || !branchId) {
      return false;
    }

    // Admin and Regional Manager can access all branches
    if (hasRole(['Admin', 'Regional Manager'])) {
      return true;
    }

    // Check if user's branch matches
    if (user.branch) {
      // Handle both object and string format
      const userBranchId = typeof user.branch === 'object' ? user.branch._id : user.branch;
      return userBranchId === branchId;
    }

    return false;
  };

  /**
   * Check if user can manage other users
   * @returns {boolean}
   */
  const canManageUsers = () => {
    return hasPermission(PERMISSIONS.USERS.CREATE) || 
           hasPermission(PERMISSIONS.USERS.UPDATE) || 
           hasPermission(PERMISSIONS.USERS.DELETE);
  };

  /**
   * Check if user can create/edit products
   * @returns {boolean}
   */
  const canManageProducts = () => {
    return hasPermission(PERMISSIONS.PRODUCTS.CREATE) || 
           hasPermission(PERMISSIONS.PRODUCTS.UPDATE);
  };

  /**
   * Check if user can make sales
   * @returns {boolean}
   */
  const canMakeSales = () => {
    return hasPermission(PERMISSIONS.SALES.CREATE);
  };

  /**
   * Check if user can manage inventory
   * @returns {boolean}
   */
  const canManageInventory = () => {
    return hasPermission(PERMISSIONS.INVENTORY.UPDATE) || 
           hasPermission(PERMISSIONS.INVENTORY.ADJUST) ||
           hasPermission(PERMISSIONS.INVENTORY.TRANSFER);
  };

  /**
   * Check if user can view reports
   * @returns {boolean}
   */
  const canViewReports = () => {
    return hasPermission(PERMISSIONS.REPORTS.READ);
  };

  /**
   * Check if user can export data
   * @returns {boolean}
   */
  const canExportData = () => {
    return hasPermission(PERMISSIONS.PRODUCTS.EXPORT) || 
           hasPermission(PERMISSIONS.REPORTS.EXPORT);
  };

  return {
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checking
    hasRole,
    isAdmin,
    isManager,
    isCashier,
    isViewer,
    
    // Route access
    canAccessRoute,
    
    // Branch checking
    belongsToBranch,
    
    // Common permission helpers
    canManageUsers,
    canManageProducts,
    canMakeSales,
    canManageInventory,
    canViewReports,
    canExportData,
    
    // Utilities
    getRoleDisplay,
    
    // User info
    user,
  };
};

export default usePermission;
