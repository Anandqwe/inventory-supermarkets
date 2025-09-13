import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: HomeIcon,
    description: 'Overview and analytics'
  },
  { 
    name: 'Products', 
    href: '/products', 
    icon: CubeIcon,
    description: 'Manage inventory'
  },
  { 
    name: 'Sales', 
    href: '/sales', 
    icon: ShoppingCartIcon,
    description: 'Record transactions'
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: ChartBarIcon,
    description: 'Business insights'
  },
];

const Sidebar = ({ isOpen, onClose, lowStockCount = 0, onLogout }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-surface-900/50 lg:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar - Fixed positioned */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64">
        <div className="flex h-full flex-col bg-white dark:bg-[#09090b] border-r border-surface-200 dark:border-[#27272a]">
          {/* Header */}
          <div className="flex items-center flex-shrink-0 px-4 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Inventory
                </h1>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Management System
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav 
            className="mt-4 flex-1 px-2 space-y-1 overflow-y-auto" 
            id="sidebar-navigation"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      isActive
                        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-r-2 border-violet-600"
                        : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100"
                    )
                  }
                  aria-label={`Navigate to ${item.name}: ${item.description}`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive 
                            ? "text-violet-600 dark:text-violet-400" 
                            : "text-surface-400 dark:text-surface-500 group-hover:text-surface-500 dark:group-hover:text-surface-400"
                        )}
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <div>{item.name}</div>
                        <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                      {item.name === 'Products' && lowStockCount > 0 && (
                        <Badge 
                          variant="warning" 
                          size="sm"
                          aria-label={`${lowStockCount} low stock items`}
                        >
                          {lowStockCount}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <div 
              className="mx-2 mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                    {lowStockCount} item{lowStockCount > 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} restocking
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          {onLogout && (
            <div className="mx-2 mb-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-all duration-200"
                aria-label="Sign out of your account"
              >
                <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                <div className="flex-1 text-left">
                  <div>Sign Out</div>
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    Log out of your account
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#09090b] shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-gray-800">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  Inventory
                </h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-surface-400 hover:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      isActive
                        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                        : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive 
                            ? "text-violet-600 dark:text-violet-400" 
                            : "text-surface-400 dark:text-surface-500 group-hover:text-surface-500 dark:group-hover:text-surface-400"
                        )}
                      />
                      <div className="flex-1">
                        <div>{item.name}</div>
                        <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                      {item.name === 'Products' && lowStockCount > 0 && (
                        <Badge variant="warning" size="sm">
                          {lowStockCount}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Low Stock Alert - Mobile */}
          {lowStockCount > 0 && (
            <div className="m-2 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                    {lowStockCount} item{lowStockCount > 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} restocking
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign Out Button - Mobile */}
          {onLogout && (
            <div className="m-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-all duration-200"
                aria-label="Sign out of your account"
              >
                <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                <div className="flex-1 text-left">
                  <div>Sign Out</div>
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    Log out of your account
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

Sidebar.displayName = "Sidebar";

export { Sidebar };