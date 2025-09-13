import React from 'react';
import { cn } from '../../utils/cn';

const EmptyState = ({ 
  icon: Icon,
  title,
  description,
  action,
  className 
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-surface-400 dark:text-surface-500 mb-4" />
      )}
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

const ErrorState = ({ 
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  onRetry,
  className 
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      <div className="mx-auto h-12 w-12 text-danger-500 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
        {title}
      </h3>
      <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Try again
        </button>
      )}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
ErrorState.displayName = "ErrorState";

export { EmptyState, ErrorState };