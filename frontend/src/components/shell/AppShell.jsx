import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { SkipLink } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const AppShell = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-amoled-black">
      {/* Skip Links for accessibility */}
      <SkipLink href="#main-content" />
      <SkipLink href="#sidebar-navigation" className="focus:top-16">
        Skip to navigation
      </SkipLink>
      
      {/* Sidebar component handles both mobile and desktop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      {/* Main content area with responsive layout */}
      <div className="lg:ml-64 transition-all duration-200 ease-in-out">
        {/* Top bar */}
        <TopBar 
          user={user}
          onMenuClick={() => setSidebarOpen(true)} 
          onLogout={logout}
        />

        {/* Page content with improved spacing and container */}
        <main 
          id="main-content"
          className={cn(
            "px-4 sm:px-6 lg:px-8 py-6",
            "min-h-[calc(100vh-4rem)]", // Full height minus header
            className
          )}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-amoled-dark border-t border-surface-200 dark:border-amoled-border mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 dark:text-amoled-muted">
              <div className="flex items-center space-x-4">
                <span>© 2024 Supermarket Inventory System</span>
                <span>•</span>
                <span>Version 1.0.0</span>
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <a 
                  href="#" 
                  className="hover:text-slate-700 dark:hover:text-amoled-secondary transition-colors"
                >
                  Help
                </a>
                <span>•</span>
                <a 
                  href="#" 
                  className="hover:text-slate-700 dark:hover:text-amoled-secondary transition-colors"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

AppShell.displayName = "AppShell";

export { AppShell };