import React from 'react';
import { Button } from './Button';
import { usePermission } from '../../hooks/usePermission';

/**
 * Protected Button Component
 * Automatically hides or disables button based on user permissions
 * 
 * @example
 * <ProtectedButton 
 *   permission="products.create"
 *   onClick={handleCreate}
 * >
 *   Create Product
 * </ProtectedButton>
 */
export const ProtectedButton = ({ 
  permission, 
  permissions, // Array of permissions (ANY)
  requireAll = false, // If true, user needs ALL permissions
  hideIfNoPermission = false, // If true, hide button instead of disabling
  fallback = null, // Component to show if no permission and hideIfNoPermission is false
  children,
  ...buttonProps 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  // Determine if user has required permission(s)
  let hasAccess = false;
  
  if (permission) {
    // Single permission check
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions)) {
    // Multiple permissions check
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  // Hide button if no permission and hideIfNoPermission is true
  if (!hasAccess && hideIfNoPermission) {
    return fallback;
  }

  // Disable button if no permission
  return (
    <Button 
      {...buttonProps}
      disabled={!hasAccess || buttonProps.disabled}
      title={!hasAccess ? 'You do not have permission to perform this action' : buttonProps.title}
    >
      {children}
    </Button>
  );
};

export default ProtectedButton;
