import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Input, Card } from '../components/ui';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { CubeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setError(''); // Clear error when user starts typing
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please fill in all fields';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/', { replace: true });
      } else {
        const errorMsg = result.message || 'Invalid email or password';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || 'Login failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@mumbaisupermart.com', password: 'Mumbai@123456' },
    { role: 'Regional Manager', email: 'regional.manager@mumbaisupermart.com', password: 'Mumbai@123456' },
    { role: 'Store Manager', email: 'manager.andheri@mumbaisupermart.com', password: 'Mumbai@123456' },
    { role: 'Inventory Manager', email: 'inventory.andheri@mumbaisupermart.com', password: 'Mumbai@123456' },
    { role: 'Cashier', email: 'cashier1.andheri@mumbaisupermart.com', password: 'Mumbai@123456' }
  ];

  const fillDemo = (email, password) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-black flex flex-col">
      {/* Header with theme toggle */}
      <header className="flex justify-between items-center p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <CubeIcon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              Inventory System
            </h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and title */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-600">
              <CubeIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-surface-900 dark:text-surface-100">
              Welcome back
            </h2>
            <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">
              Sign in to your supermarket inventory account
            </p>
          </div>

          {/* Login form */}
          <Card className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Email address"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-surface-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-surface-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Card>

          {/* Demo credentials */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-4 text-center">
              Demo Credentials
            </h3>
            <p className="text-xs text-surface-600 dark:text-surface-400 mb-4 text-center">
              Click any credential below to automatically fill the form:
            </p>
            <div className="space-y-2">
              {demoCredentials.map((cred, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillDemo(cred.email, cred.password)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 text-sm bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors border border-surface-200 dark:border-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {cred.role}
                      </span>
                      <div className="text-xs text-surface-600 dark:text-surface-400 mt-1">
                        {cred.email}
                      </div>
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-500">
                      Click to fill
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Supermarket Inventory & Sales Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
