import React, { useState } from 'react';
import { 
  Bars3Icon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDownIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Badge, NotificationBadge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const TopBar = ({ user, onMenuClick, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: 1, title: 'Low Stock Alert', message: 'Product X is running low', type: 'warning', unread: true },
    { id: 2, title: 'New Sale', message: 'Sale #12345 completed', type: 'info', unread: true },
    { id: 3, title: 'System Update', message: 'Inventory updated successfully', type: 'success', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement global search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className="bg-white dark:bg-[#000000] border-b border-slate-200 dark:border-zinc-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-[#000000]/95">
      {/* Left side - Mobile menu button and logo */}
      <div className="flex items-center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
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
            <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
              Inventory
            </h1>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
              Supermarket Inventory System
            </h1>
          </div>
        </div>
      </div>

      {/* Center - Enhanced Search */}
      <div className="hidden md:block flex-1 max-w-lg mx-8">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, sales, customers..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all duration-200"
          />
        </form>
      </div>

      {/* Right side - Notifications, theme toggle, and user menu */}
      <div className="flex items-center space-x-1">
        {/* Notifications */}
        <Menu as="div" className="relative">
          <Menu.Button className="relative p-2 text-slate-400 hover:text-slate-500 dark:text-zinc-500 dark:hover:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-lg transition-colors">
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <NotificationBadge count={unreadCount} />
            )}
          </Menu.Button>

          <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-lg bg-white dark:bg-zinc-950 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-zinc-700 focus:outline-none">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  Notifications
                </h3>
                <Badge variant="secondary" size="sm">
                  {unreadCount} new
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div className={cn(
                        "p-3 rounded-md cursor-pointer transition-colors",
                        active ? "bg-slate-50 dark:bg-zinc-900" : "",
                        notification.unread ? "bg-violet-50 dark:bg-violet-900/10" : ""
                      )}>
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 truncate">
                              {notification.message}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="ml-2 h-2 w-2 bg-violet-600 rounded-full" />
                          )}
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" size="sm" className="w-full">
                  View all notifications
                </Button>
              </div>
            </div>
          </Menu.Items>
        </Menu>

        {/* Theme toggle */}
        <ThemeToggle size="icon" />

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="sr-only">Open user menu</span>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {user?.email || 'No email'}
                </div>
              </div>
              <ChevronDownIcon className="hidden sm:block h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </Menu.Button>

          <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-zinc-950 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-zinc-700 focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-700">
                <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  {user?.email || 'No email'}
                </div>
                {user?.role && (
                  <Badge variant="secondary" size="sm" className="mt-1">
                    {user.role}
                  </Badge>
                )}
              </div>
              
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button className={cn(
                      "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                      active 
                        ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" 
                        : "text-slate-700 dark:text-zinc-300"
                    )}>
                      <UserCircleIcon className="h-4 w-4 mr-3" />
                      Your Profile
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button className={cn(
                      "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                      active 
                        ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" 
                        : "text-slate-700 dark:text-zinc-300"
                    )}>
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                  )}
                </Menu.Item>
                
                <div className="border-t border-slate-200 dark:border-zinc-700 my-1" />
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onLogout}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                        active 
                          ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" 
                          : "text-slate-700 dark:text-zinc-300"
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  );
};

TopBar.displayName = "TopBar";

export { TopBar };