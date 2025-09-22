import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

// Enhanced route mapping with nested routes
const routeNames = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/products/new': 'Add Product',
  '/products/edit': 'Edit Product',
  '/products/import': 'Import Products',
  '/sales': 'Sales',
  '/sales/pos': 'Point of Sale',
  '/sales/history': 'Sales History',
  '/sales/new': 'New Sale',
  '/inventory': 'Inventory',
  '/inventory/stock': 'Stock Management',
  '/inventory/adjustments': 'Stock Adjustments',
  '/inventory/transfers': 'Stock Transfers',
  '/reports': 'Reports',
  '/reports/sales': 'Sales Reports',
  '/reports/inventory': 'Inventory Reports',
  '/reports/financial': 'Financial Reports',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/system': 'System Settings',
  '/settings/users': 'User Management',
  '/settings/branches': 'Branches',
};

const Breadcrumbs = ({ className, items }) => {
  const location = useLocation();
  
  // If custom items provided, use them
  if (items && items.length > 0) {
    return (
      <nav className={cn("flex py-2", className)} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link 
              to="/" 
              className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
              aria-label="Home"
            >
              <HomeIcon className="flex-shrink-0 h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href || index}>
              <div className="flex items-center">
                <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-slate-400 dark:text-slate-500 mx-2" />
                {item.href && !item.current ? (
                  <Link
                    to={item.href}
                    className="font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span 
                    className="font-medium text-slate-700 dark:text-slate-300"
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Auto-generate breadcrumbs from pathname
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs for home page
  if (location.pathname === '/' || pathnames.length === 0) {
    return null;
  }

  const breadcrumbs = [];

  // Build breadcrumb trail
  pathnames.forEach((segment, index) => {
    const href = '/' + pathnames.slice(0, index + 1).join('/');
    const fullPath = href;
    const isLast = index === pathnames.length - 1;
    
    // Try to get display name from route mapping, fallback to formatted segment
    let displayName = routeNames[fullPath];
    
    if (!displayName) {
      // If it's an ID (all numbers), try to get parent route name
      if (/^\d+$/.test(segment)) {
        const parentPath = '/' + pathnames.slice(0, index).join('/');
        const parentName = routeNames[parentPath] || pathnames[index - 1];
        displayName = `${parentName} #${segment}`;
      } else {
        // Format segment name
        displayName = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
    
    breadcrumbs.push({
      name: displayName,
      href: fullPath,
      current: isLast,
    });
  });

  return (
    <nav className={cn("flex py-2", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            to="/" 
            className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-md p-1"
            aria-label="Home"
          >
            <HomeIcon className="flex-shrink-0 h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb) => (
          <li key={breadcrumb.href}>
            <div className="flex items-center">
              <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-slate-400 dark:text-slate-500 mx-2" />
              {breadcrumb.current ? (
                <span 
                  className="font-medium text-slate-700 dark:text-slate-300"
                  aria-current="page"
                >
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  to={breadcrumb.href}
                  className="font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-md px-1"
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