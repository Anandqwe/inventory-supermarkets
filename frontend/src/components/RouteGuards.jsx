import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { PageLoader } from './LoadingSpinner';
import AccessDenied from './AccessDenied';

/**
 * Permission-based route guard component
 * Checks both authentication and specific permissions
 * 
 * @example
 * <PermissionRoute permission={PERMISSIONS.PRODUCTS.READ}>
 *   <Products />
 * </PermissionRoute>
 * 
 * @example Multiple permissions (ANY)
 * <PermissionRoute permissions={[PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE]} requireAll={false}>
 *   <Sales />
 * </PermissionRoute>
 */
export const PermissionRoute = ({ 
  children, 
  permission = null, 
  permissions = null,
  requireAll = false,
  fallback = null,
  redirectTo = null,
  showAccessDenied = true
}) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  // Show loader while checking authentication
  if (loading) {
    return <PageLoader message="Checking permissions..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // If no access, show appropriate fallback
  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (fallback) {
      return fallback;
    }
    if (showAccessDenied) {
      return (
        <AccessDenied 
          requiredPermission={permission || (permissions && permissions.join(', '))}
        />
      );
    }
    // Default: redirect to dashboard
    return <Navigate to="/" replace />;
  }

  // User has access, render children
  return <>{children}</>;
};

/**
 * Role-based route guard component
 * Checks if user has specific role(s)
 * 
 * @example Single role
 * <RoleRoute role="Admin">
 *   <AdminPanel />
 * </RoleRoute>
 * 
 * @example Multiple roles (ANY)
 * <RoleRoute roles={['Admin', 'Store Manager']}>
 *   <UserManagement />
 * </RoleRoute>
 */
export const RoleRoute = ({ 
  children, 
  role = null,
  roles = null,
  fallback = null,
  redirectTo = null,
  showAccessDenied = true
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { hasRole } = usePermission();

  // Show loader while checking authentication
  if (loading) {
    return <PageLoader message="Checking access..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  let hasAccess = true;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles && Array.isArray(roles) && roles.length > 0) {
    hasAccess = hasRole(roles);
  }

  // If no access, show appropriate fallback
  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (fallback) {
      return fallback;
    }
    if (showAccessDenied) {
      return (
        <AccessDenied 
          message={`This page is only accessible to ${role || roles?.join(', ')} users.`}
          requiredPermission={`Role: ${role || roles?.join(', ')}`}
        />
      );
    }
    // Default: redirect to dashboard
    return <Navigate to="/" replace />;
  }

  // User has access, render children
  return <>{children}</>;
};

/**
 * Higher-order component for permission-based rendering
 * Use this to wrap components that need permission checks
 * 
 * @example
 * export default withPermission(MyComponent, PERMISSIONS.PRODUCTS.CREATE);
 */
export const withPermission = (Component, permission) => {
  return function PermissionWrapper(props) {
    return (
      <PermissionRoute permission={permission}>
        <Component {...props} />
      </PermissionRoute>
    );
  };
};

/**
 * Higher-order component for role-based rendering
 * Use this to wrap components that need role checks
 * 
 * @example
 * export default withRole(AdminPanel, 'Admin');
 */
export const withRole = (Component, role) => {
  return function RoleWrapper(props) {
    return (
      <RoleRoute role={role}>
        <Component {...props} />
      </RoleRoute>
    );
  };
};

export default PermissionRoute;
