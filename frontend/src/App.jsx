import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/shell';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader } from './components/LoadingSpinner';
import Toast from './components/Toast';

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
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader message="Checking authentication..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <ErrorBoundary>
      <AppShell>
        {children}
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
                
                {/* Protected Routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading dashboard..." />}>
                        <Dashboard />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading products..." />}>
                        <Products />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/sales" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading sales..." />}>
                        <Sales />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading inventory..." />}>
                        <Inventory />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading reports..." />}>
                        <Reports />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper fallback={<PageLoader message="Loading settings..." />}>
                        <Settings />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Global Toast Notifications */}
              <Toast />
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
