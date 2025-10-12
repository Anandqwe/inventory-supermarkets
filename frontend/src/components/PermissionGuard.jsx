import React from 'react';
import { usePermission } from '../hooks/usePermission';

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 * Use this for inline UI elements (buttons, sections, menu items, etc.)
 * 
 * @example Single permission
 * <PermissionGuard permission={PERMISSIONS.PRODUCTS.CREATE}>
 *   <Button>Create Product</Button>
 * </PermissionGuard>
 * 
 * @example Multiple permissions (ANY)
 * <PermissionGuard permissions={[PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE]}>
 *   <SalesSection />
 * </PermissionGuard>
 * 
 * @example Multiple permissions (ALL required)
 * <PermissionGuard permissions={[PERMISSIONS.PRODUCTS.CREATE, PERMISSIONS.PRODUCTS.UPDATE]} requireAll>
 *   <AdvancedProductEditor />
 * </PermissionGuard>
 * 
 * @example With fallback
 * <PermissionGuard permission={PERMISSIONS.REPORTS.READ} fallback={<p>No access</p>}>
 *   <ReportsTable />
 * </PermissionGuard>
 */
export const PermissionGuard = ({ 
  children, 
  permission = null,
  permissions = null,
  requireAll = false,
  fallback = null,
  invert = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Check multiple permissions
  else if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  // No permission specified = always show (useful for debugging)
  else {
    hasAccess = true;
  }

  // Invert logic if needed (useful for showing "upgrade" messages to limited users)
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Render children if has access, otherwise show fallback
  return hasAccess ? <>{children}</> : (fallback || null);
};

/**
 * Role Guard Component
 * Conditionally renders children based on user role
 * Use this for role-specific UI elements
 * 
 * @example Single role
 * <RoleGuard role="Admin">
 *   <AdminSettings />
 * </RoleGuard>
 * 
 * @example Multiple roles
 * <RoleGuard roles={['Admin', 'Store Manager']}>
 *   <UserManagementSection />
 * </RoleGuard>
 */
export const RoleGuard = ({ 
  children, 
  role = null,
  roles = null,
  fallback = null,
  invert = false
}) => {
  const { hasRole } = usePermission();

  let hasAccess = false;

  // Check single role
  if (role) {
    hasAccess = hasRole(role);
  }
  // Check multiple roles
  else if (roles && Array.isArray(roles) && roles.length > 0) {
    hasAccess = hasRole(roles);
  }
  // No role specified = always show
  else {
    hasAccess = true;
  }

  // Invert logic if needed
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Render children if has access, otherwise show fallback
  return hasAccess ? <>{children}</> : (fallback || null);
};

/**
 * Branch Guard Component
 * Conditionally renders children based on branch access
 * Use this for branch-specific content
 * 
 * @example
 * <BranchGuard branchId={product.branch}>
 *   <EditButton />
 * </BranchGuard>
 */
export const BranchGuard = ({ 
  children, 
  branchId,
  fallback = null
}) => {
  const { belongsToBranch } = usePermission();

  const hasAccess = belongsToBranch(branchId);

  return hasAccess ? <>{children}</> : (fallback || null);
};

/**
 * Admin Only Guard Component
 * Shorthand for admin-only content
 * 
 * @example
 * <AdminOnly>
 *   <DangerZone />
 * </AdminOnly>
 */
export const AdminOnly = ({ children, fallback = null }) => {
  const { isAdmin } = usePermission();
  return isAdmin() ? <>{children}</> : (fallback || null);
};

/**
 * Manager Only Guard Component
 * Shorthand for manager-only content (Admin, Regional Manager, Store Manager, Inventory Manager)
 * 
 * @example
 * <ManagerOnly>
 *   <ApprovalSection />
 * </ManagerOnly>
 */
export const ManagerOnly = ({ children, fallback = null }) => {
  const { isManager } = usePermission();
  return isManager() ? <>{children}</> : (fallback || null);
};

/**
 * Viewer Block Component
 * Hides content from Viewer role (read-only users)
 * Useful for edit/delete buttons
 * 
 * @example
 * <ViewerBlock>
 *   <DeleteButton />
 * </ViewerBlock>
 */
export const ViewerBlock = ({ children, fallback = null }) => {
  const { isViewer } = usePermission();
  return !isViewer() ? <>{children}</> : (fallback || null);
};

/**
 * Higher-order component for permission-based rendering
 * Wraps a component with permission checking
 * 
 * @example
 * const ProtectedButton = withPermissionGuard(Button, PERMISSIONS.PRODUCTS.CREATE);
 */
export const withPermissionGuard = (Component, permission, fallback = null) => {
  return function GuardedComponent(props) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

export default PermissionGuard;
