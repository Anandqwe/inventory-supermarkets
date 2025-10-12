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
import GlobalSearch from '../GlobalSearch';
import MobileSearchModal from '../MobileSearchModal';

const TopBar = ({ user, onMenuClick, onLogout }) => {
  const [notifications] = useState([
    { id: 1, title: 'Low Stock Alert', message: 'Product X is running low', type: 'warning', unread: true },
    { id: 2, title: 'New Sale', message: 'Sale #12345 completed', type: 'info', unread: true },
    { id: 3, title: 'System Update', message: 'Inventory updated successfully', type: 'success', unread: false },
  ]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <header className="bg-white dark:bg-amoled-black border-b border-slate-200 dark:border-amoled-border h-14 md:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 flex-shrink-0 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-amoled-black/95">
        {/* Left side - Mobile menu button and logo */}
        <div className="flex items-center min-w-0 flex-shrink-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden mr-2 flex-shrink-0"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </Button>

          {/* Logo and title - Responsive text */}
          <div className="flex items-center min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-amoled-primary truncate">
              <span className="lg:hidden">Inventory</span>
              <span className="hidden lg:inline">Supermarket Inventory System</span>
            </h1>
          </div>
        </div>

        {/* Center - Desktop Search (Hidden on mobile) */}
        <div className="hidden md:block flex-1 max-w-xl mx-4 lg:mx-8">
          <GlobalSearch />
        </div>

        {/* Right side - Search button (mobile), Notifications, theme toggle, and user menu */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Mobile Search Button - Only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Button>
          {/* Notifications - Hidden on small mobile */}
        <Menu as="div" className="relative hidden sm:block">
          <Menu.Button className="relative p-1.5 md:p-2 text-slate-400 hover:text-slate-500 dark:text-amoled-muted dark:hover:text-amoled-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors">
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5 md:h-6 md:w-6" />
            {unreadCount > 0 && (
              <NotificationBadge count={unreadCount} />
            )}
          </Menu.Button>

          <Menu.Items className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right rounded-lg bg-white dark:bg-amoled-card shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-amoled-border focus:outline-none">
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-amoled-primary">
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
              
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-amoled-border">
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
          <Menu.Button className="flex items-center text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1 md:p-1.5 hover:bg-slate-100 dark:hover:bg-amoled-hover transition-colors">
            <span className="sr-only">Open user menu</span>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-amoled-primary truncate max-w-[120px] lg:max-w-[150px]">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-amoled-muted truncate max-w-[120px] lg:max-w-[150px]">
                  {user?.email || 'No email'}
                </div>
              </div>
              <ChevronDownIcon className="hidden md:block h-4 w-4 text-slate-400 dark:text-amoled-muted flex-shrink-0" />
            </div>
          </Menu.Button>

          <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-amoled-card shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-amoled-border focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-amoled-border">
                <div className="text-sm font-medium text-slate-900 dark:text-amoled-primary">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-amoled-muted">
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
                        ? "bg-slate-100 dark:bg-amoled-hover text-slate-900 dark:text-amoled-primary" 
                        : "text-slate-700 dark:text-amoled-secondary"
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
                        ? "bg-slate-100 dark:bg-amoled-hover text-slate-900 dark:text-amoled-primary" 
                        : "text-slate-700 dark:text-amoled-secondary"
                    )}>
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                  )}
                </Menu.Item>
                
                <div className="border-t border-slate-200 dark:border-amoled-border my-1" />
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onLogout}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                        active 
                          ? "bg-slate-100 dark:bg-amoled-hover text-slate-900 dark:text-amoled-primary" 
                          : "text-slate-700 dark:text-amoled-secondary"
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

    {/* Mobile Search Modal */}
    <MobileSearchModal 
      isOpen={isMobileSearchOpen} 
      onClose={() => setIsMobileSearchOpen(false)} 
    />
  </>
  );
};

TopBar.displayName = "TopBar";

export { TopBar };