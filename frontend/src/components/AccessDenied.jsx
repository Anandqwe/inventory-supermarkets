import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

/**
 * Access Denied Page
 * Shown when user tries to access a page they don't have permission for
 */
const AccessDenied = ({ 
  message = "You don't have permission to access this page.",
  requiredPermission = null,
  showBackButton = true 
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-amoled-black dark:via-slate-900 dark:to-amoled-black flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/20">
          <ShieldExclamationIcon className="h-14 w-14 text-red-600 dark:text-red-400" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-amoled-primary">
            Access Denied
          </h1>
          <p className="text-base text-surface-600 dark:text-amoled-secondary">
            {message}
          </p>
          
          {/* User info */}
          {user && (
            <div className="mt-4 p-4 bg-surface-50 dark:bg-amoled-hover rounded-lg border border-surface-200 dark:border-amoled-border">
              <p className="text-sm text-surface-700 dark:text-amoled-secondary">
                <span className="font-medium">Current Role:</span>{' '}
                <span className="text-surface-900 dark:text-amoled-primary font-semibold">
                  {user.role}
                </span>
              </p>
              {requiredPermission && (
                <p className="text-xs text-surface-500 dark:text-amoled-muted mt-2">
                  Required permission: <code className="bg-surface-100 dark:bg-amoled-black px-1.5 py-0.5 rounded text-surface-700 dark:text-amoled-secondary">{requiredPermission}</code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          {showBackButton && (
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="inline-flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
          <Button
            onClick={handleGoHome}
            variant="primary"
            className="inline-flex items-center"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>

        {/* Additional help */}
        <div className="mt-8 text-sm text-surface-500 dark:text-amoled-muted">
          <p>
            If you believe this is an error, please contact your administrator.
          </p>
          <button
            onClick={logout}
            className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
