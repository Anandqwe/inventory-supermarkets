import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import MobileSearchModal from '../MobileSearchModal';

const TopBar = ({ user, onMenuClick, onLogout }) => {
  const navigate = useNavigate();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-900 h-14 md:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 flex-shrink-0 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-black/95">
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
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-zinc-100 truncate">
              <span className="lg:hidden">Mumbai Supermart</span>
              <span className="hidden lg:inline">Mumbai Supermart - Inventory System</span>
            </h1>
          </div>
        </div>

        {/* Center - Desktop Search (Hidden on mobile) */}
        <div className="hidden md:block flex-1 max-w-xl mx-4 lg:mx-8">
        </div>

        {/* Right side - Search button (mobile), theme toggle, and user menu */}
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

        {/* Theme toggle */}
        <ThemeToggle size="icon" />

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1 md:p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
            <span className="sr-only">Open user menu</span>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate max-w-[120px] lg:max-w-[150px]">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-600 truncate max-w-[120px] lg:max-w-[150px]">
                  {user?.email || 'No email'}
                </div>
              </div>
              <ChevronDownIcon className="hidden md:block h-4 w-4 text-slate-400 dark:text-zinc-600 flex-shrink-0" />
            </div>
          </Menu.Button>

          <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-zinc-950 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-zinc-900 focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-900">
                <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-600">
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
                    <button 
                      onClick={() => navigate('/settings')}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                        active 
                          ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" 
                          : "text-slate-700 dark:text-zinc-400"
                      )}>
                      <UserCircleIcon className="h-4 w-4 mr-3" />
                      Your Profile
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={() => navigate('/settings')}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                        active 
                          ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" 
                          : "text-slate-700 dark:text-zinc-400"
                      )}>
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                  )}
                </Menu.Item>
                
                <div className="border-t border-slate-200 dark:border-zinc-900 my-1" />
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onLogout}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center transition-colors",
                        active 
                          ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100" 
                          : "text-slate-700 dark:text-zinc-400"
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