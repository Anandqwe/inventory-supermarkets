import React from 'react';
import { 
  Bars3Icon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const TopBar = ({ user, onMenuClick, onLogout }) => {
  return (
    <header className="bg-white dark:bg-surface-975 border-b border-surface-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 sticky top-0 z-10">
      {/* Left side - Mobile menu button and logo */}
      <div className="flex items-center">
        {/* Mobile menu button */}
        <Button
          variant="subtle"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden mr-2"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>

        {/* Logo and title */}
        <div className="flex items-center">
          <div className="flex-shrink-0 lg:hidden">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Inventory
            </h1>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
              Supermarket Inventory System
            </h1>
          </div>
        </div>
      </div>

      {/* Center - Search (placeholder for now) */}
      <div className="hidden md:block flex-1 max-w-lg mx-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-surface-400" />
          </div>
          <input
            type="text"
            placeholder="Search products, sales..."
            className="block w-full pl-10 pr-3 py-2 border border-surface-300 dark:border-surface-600 rounded-md bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 placeholder-surface-500 dark:placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Right side - Theme toggle and user menu */}
      <div className="flex items-center space-x-2">
        {/* Theme toggle */}
        <ThemeToggle size="icon" />

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-2 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <span className="sr-only">Open user menu</span>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {user?.email || 'No email'}
                </div>
              </div>
              <ChevronDownIcon className="hidden sm:block h-4 w-4 text-surface-400" />
            </div>
          </Menu.Button>

          <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-surface-900/5 dark:ring-gray-700/50 focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-surface-200 dark:border-gray-700">
                <div className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {user?.email || 'No email'}
                </div>
                {user?.role && (
                  <Badge variant="secondary" size="sm" className="mt-1">
                    {user.role}
                  </Badge>
                )}
              </div>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onLogout}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      active 
                        ? "bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-surface-100" 
                        : "text-surface-700 dark:text-surface-300"
                    )}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  );
};

TopBar.displayName = "TopBar";

export { TopBar };