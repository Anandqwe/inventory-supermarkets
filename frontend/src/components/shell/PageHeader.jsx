import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { cn } from '../../utils/cn';

const PageHeader = ({ 
  title, 
  subtitle, 
  children, 
  showBreadcrumbs = true,
  breadcrumbs,
  className,
  action,
  tabs
}) => {
  return (
    <div className={cn("border-b border-slate-200 dark:border-slate-700 pb-4 mb-6", className)}>
      {showBreadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {subtitle}
            </div>
          )}
        </div>
        
        {(children || action) && (
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
            {action}
            {children}
          </div>
        )}
      </div>
      
      {tabs && (
        <div className="mt-4">
          {tabs}
        </div>
      )}
    </div>
  );
};

PageHeader.displayName = "PageHeader";

export { PageHeader };