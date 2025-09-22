import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-surface-900 text-surface-50 dark:bg-surface-50 dark:text-surface-900",
        secondary: "border-transparent bg-surface-100 text-surface-900 dark:bg-surface-800 dark:text-surface-300",
        destructive: "border-transparent bg-danger-500 text-danger-50",
        outline: "text-surface-900 dark:text-surface-100",
        success: "border-transparent bg-emerald-900 text-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        warning: "border-transparent bg-amber-900 text-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        info: "border-transparent bg-accent-500 text-accent-50",
        danger: "border-transparent bg-rose-900 text-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Badge = React.forwardRef(({ 
  className, 
  variant,
  size,
  children,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  );
});

Badge.displayName = "Badge";

// Status Badge Component
const StatusBadge = ({ status, ...props }) => {
  const getVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'success':
      case 'paid':
        return 'success';
      case 'pending':
      case 'warning':
      case 'low-stock':
        return 'warning';
      case 'inactive':
      case 'cancelled':
      case 'error':
      case 'failed':
      case 'out-of-stock':
        return 'destructive';
      case 'info':
      case 'processing':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(status)} {...props}>
      {status}
    </Badge>
  );
};

StatusBadge.displayName = "StatusBadge";

// Notification Badge Component
const NotificationBadge = ({ count, max = 99, ...props }) => {
  const displayCount = count > max ? `${max}+` : count;
  
  return (
    <Badge 
      variant="destructive" 
      className="h-5 min-w-5 justify-center rounded-full p-0 text-xs" 
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

NotificationBadge.displayName = "NotificationBadge";

// Category Badge Component
const CategoryBadge = ({ category, color, ...props }) => {
  const getCategoryStyle = (category) => {
    const categoryStyles = {
      electronics: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      clothing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      food: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      books: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      home: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      sports: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      toys: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      health: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    };
    
    return categoryStyles[category?.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(getCategoryStyle(category), "border-transparent")}
      style={color ? { backgroundColor: `${color}20`, color: color } : {}}
      {...props}
    >
      {category}
    </Badge>
  );
};

CategoryBadge.displayName = "CategoryBadge";

export { Badge, StatusBadge, NotificationBadge, CategoryBadge, badgeVariants };