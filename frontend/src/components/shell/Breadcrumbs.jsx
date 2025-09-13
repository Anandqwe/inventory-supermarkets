import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

const routeNames = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/sales': 'Sales',
  '/reports': 'Reports',
};

const Breadcrumbs = ({ className }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs for home page
  if (location.pathname === '/') {
    return null;
  }

  const breadcrumbs = [
    { name: 'Dashboard', href: '/', current: false },
    ...pathnames.map((name, index) => {
      const href = `/${pathnames.slice(0, index + 1).join('/')}`;
      const routeName = routeNames[href] || name.charAt(0).toUpperCase() + name.slice(1);
      const isLast = index === pathnames.length - 1;
      
      return {
        name: routeName,
        href,
        current: isLast,
      };
    }),
  ];

  return (
    <nav className={cn("flex py-1", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <div>
            <Link 
              to="/" 
              className="text-surface-400 hover:text-surface-500 dark:text-surface-500 dark:hover:text-surface-400 transition-colors"
              aria-label="Home"
            >
              <HomeIcon className="flex-shrink-0 h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {breadcrumbs.slice(1).map((breadcrumb, index) => (
          <li key={breadcrumb.href}>
            <div className="flex items-center">
              <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-surface-400 dark:text-surface-500" />
              {breadcrumb.current ? (
                <span 
                  className="ml-2 text-sm font-medium text-surface-700 dark:text-surface-300"
                  aria-current="page"
                >
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  to={breadcrumb.href}
                  className="ml-2 text-sm font-medium text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300 transition-colors"
                >
                  {breadcrumb.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };