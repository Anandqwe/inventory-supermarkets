import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { SkipLink } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-black">
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

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <TopBar 
          user={user}
          onMenuClick={() => setSidebarOpen(true)} 
          onLogout={logout}
        />

        {/* Page content */}
        <main 
          id="main-content"
          className="px-4 sm:px-6 lg:px-8 py-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

AppShell.displayName = "AppShell";

export { AppShell };