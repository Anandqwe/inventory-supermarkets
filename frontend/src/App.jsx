import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/shell';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader } from './components/LoadingSpinner';
import Toast from './components/Toast';
import { PermissionRoute } from './components/RouteGuards';
import AccessDenied from './components/AccessDenied';
import { PERMISSIONS } from '../../shared/permissions';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Products = React.lazy(() => import('./pages/Products'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component with enhanced error handling
function ProtectedRoute({ children, permission = null, permissions = null }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader message="Checking authentication..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Wrap in AppShell and use PermissionRoute for permission checking
  return (
    <ErrorBoundary>
      <AppShell>
        {permission || permissions ? (
          <PermissionRoute 
            permission={permission} 
            permissions={permissions}
            showAccessDenied={true}
          >
            {children}
          </PermissionRoute>
        ) : (
          children
        )}
      </AppShell>
    </ErrorBoundary>
  );
}

// Public Route Component
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader message="Loading..." />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// Suspense wrapper for lazy loaded components
function SuspenseWrapper({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <PageLoader />}>
      {children}
    </Suspense>
  );
}

// Toast Configuration Component
function ToastConfig() {
  const { theme } = useAuth(); // Get theme from context if available
  const isDark = theme === 'dark' || document.documentElement.classList.contains('dark');
  
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#0f172a',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Application Error
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Something went wrong. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              className="bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading login..." />}>
                        <Login />
                      </SuspenseWrapper>
                    </PublicRoute>
                  } 
                />
                
                {/* Protected Routes with Permission Checks */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute permission={PERMISSIONS.DASHBOARD.READ}>
                      <SuspenseWrapper fallback={<PageLoader message="Loading dashboard..." />}>
                        <Dashboard />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute permission={PERMISSIONS.PRODUCTS.READ}>
                      <SuspenseWrapper fallback={<PageLoader message="Loading products..." />}>
                        <Products />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/sales" 
                  element={
                    <ProtectedRoute permissions={[PERMISSIONS.SALES.READ, PERMISSIONS.SALES.CREATE]}>
                      <SuspenseWrapper fallback={<PageLoader message="Loading sales..." />}>
                        <Sales />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute permission={PERMISSIONS.INVENTORY.READ}>
                      <SuspenseWrapper fallback={<PageLoader message="Loading inventory..." />}>
                        <Inventory />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute permission={PERMISSIONS.REPORTS.READ}>
                      <SuspenseWrapper fallback={<PageLoader message="Loading reports..." />}>
                        <Reports />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute permission={PERMISSIONS.PROFILE.READ}>
                      <SuspenseWrapper fallback={<PageLoader message="Loading settings..." />}>
                        <Settings />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Access Denied Route */}
                <Route 
                  path="/access-denied" 
                  element={
                    <ProtectedRoute>
                      <AccessDenied />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Global Toast Notifications */}
              <Toast />
              <ToastConfig />
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
