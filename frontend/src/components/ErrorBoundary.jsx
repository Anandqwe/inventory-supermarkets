import React from 'react';
import { Button } from './ui/Button';
import { Alert, AlertTitle, AlertDescription } from './ui/Alert';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to your error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {this.props.showDetails && this.state.error
                  ? this.state.error.toString()
                  : "An unexpected error occurred. Please try refreshing the page."}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button onClick={this.handleReset} variant="outline">
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="primary"
              >
                Refresh Page
              </Button>
            </div>

            {this.props.showDetails && process.env.NODE_ENV === 'development' && (
              <details className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryConfig = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = () => setError(null);

  const handleError = React.useCallback((error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  // Throw error to be caught by error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

// Component Error Boundary for smaller sections
export const SectionErrorBoundary = ({ 
  children, 
  fallback, 
  showReset = true,
  resetLabel = "Try Again",
  className = ""
}) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleError = (error, errorInfo) => {
    console.error('SectionErrorBoundary caught an error:', error, errorInfo);
    setHasError(true);
    setError(error);
  };

  const handleReset = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError) {
    if (fallback) {
      return fallback(error, handleReset);
    }

    return (
      <div className={`p-4 ${className}`}>
        <Alert variant="destructive">
          <AlertTitle>Unable to load this section</AlertTitle>
          <AlertDescription>
            An error occurred while loading this content.
          </AlertDescription>
        </Alert>
        {showReset && (
          <Button 
            onClick={handleReset} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            {resetLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={(error) => handleError(error, null)}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;