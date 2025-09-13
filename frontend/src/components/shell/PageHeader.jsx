import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { cn } from '../../utils/cn';

const PageHeader = ({ 
  title, 
  subtitle, 
  children, 
  showBreadcrumbs = true,
  className 
}) => {
  return (
    <div className={cn("border-b border-surface-200 dark:border-surface-700 pb-2 mb-3", className)}>
      {showBreadcrumbs && <Breadcrumbs />}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-surface-900 dark:text-surface-100 sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {children && (
          <div className="mt-4 flex sm:ml-4 sm:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

PageHeader.displayName = "PageHeader";

export { PageHeader };