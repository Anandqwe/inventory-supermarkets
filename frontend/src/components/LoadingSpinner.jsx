import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Professional Loading Spinner Variants
const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border-2",
        sm: "h-4 w-4 border-2", 
        md: "h-8 w-8 border-2",
        lg: "h-12 w-12 border-[3px]",
        xl: "h-16 w-16 border-4"
      },
      variant: {
        default: "text-violet-600",
        primary: "text-violet-600", 
        secondary: "text-slate-600 dark:text-slate-400",
        muted: "text-slate-400 dark:text-slate-600",
        white: "text-white",
        current: "text-current"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);

const LoadingSpinner = React.forwardRef(({ 
  className, 
  size = 'md', 
  variant,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

// Dots Loading Indicator
const LoadingDots = ({ className, ...props }) => (
  <div 
    className={cn("flex space-x-1", className)} 
    role="status" 
    aria-label="Loading"
    {...props}
  >
    <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
    <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
    <div className="h-2 w-2 bg-current rounded-full animate-bounce" />
    <span className="sr-only">Loading...</span>
  </div>
);

// Full Page Loading Component
const PageLoader = ({ 
  message = "Loading...", 
  showMessage = true,
  className,
  ...props 
}) => (
  <div 
    className={cn(
      "fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
      "flex flex-col items-center justify-center z-50",
      className
    )}
    {...props}
  >
    <LoadingSpinner size="xl" className="mb-4" />
    {showMessage && (
      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
        {message}
      </p>
    )}
  </div>
);

// Inline Loading Component
const InlineLoader = ({ 
  message = "Loading...", 
  showSpinner = true,
  className,
  ...props 
}) => (
  <div 
    className={cn("flex items-center justify-center gap-2 py-8", className)}
    {...props}
  >
    {showSpinner && <LoadingSpinner size="sm" />}
    <span className="text-sm text-slate-600 dark:text-slate-400">
      {message}
    </span>
  </div>
);

export { 
  LoadingSpinner,
  LoadingDots,
  PageLoader,
  InlineLoader,
  spinnerVariants
};

// For backward compatibility
export default LoadingSpinner;
