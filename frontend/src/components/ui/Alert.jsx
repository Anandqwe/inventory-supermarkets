import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Professional Alert Variants
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white border-slate-200 text-slate-950 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-50",
        destructive: "border-red-500/50 text-red-900 dark:border-red-500 [&>svg]:text-red-600 bg-red-50 dark:bg-red-950/10 dark:text-red-400",
        success: "border-green-500/50 text-green-900 dark:border-green-500 [&>svg]:text-green-600 bg-green-50 dark:bg-green-950/10 dark:text-green-400",
        warning: "border-amber-500/50 text-amber-900 dark:border-amber-500 [&>svg]:text-amber-600 bg-amber-50 dark:bg-amber-950/10 dark:text-amber-400",
        info: "border-blue-500/50 text-blue-900 dark:border-blue-500 [&>svg]:text-blue-600 bg-blue-50 dark:bg-blue-950/10 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Enhanced Alert with Icons and Dismiss
const NotificationAlert = ({ 
  variant = "default", 
  title, 
  description, 
  dismissible = false, 
  onDismiss,
  icon: CustomIcon,
  className,
  ...props 
}) => {
  const icons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    destructive: XCircleIcon,
    info: InformationCircleIcon,
    default: InformationCircleIcon
  };

  const Icon = CustomIcon || icons[variant];

  return (
    <Alert variant={variant} className={cn("relative", className)} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};

// Toast-style Alert for temporary notifications
const ToastAlert = ({ 
  variant = "default",
  title,
  description,
  action,
  onDismiss,
  duration = 5000,
  className,
  ...props
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 w-full max-w-sm",
      "transform transition-all duration-300 ease-in-out",
      visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      className
    )}>
      <NotificationAlert
        variant={variant}
        title={title}
        description={description}
        dismissible
        onDismiss={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="shadow-lg"
        {...props}
      />
      {action && (
        <div className="mt-2 flex gap-2">
          {action}
        </div>
      )}
    </div>
  );
};

// Banner Alert for important site-wide messages
const BannerAlert = ({ 
  variant = "info",
  title,
  description,
  action,
  dismissible = true,
  onDismiss,
  className,
  ...props
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <Alert 
      variant={variant} 
      className={cn(
        "rounded-none border-x-0 border-t-0 border-b",
        "flex items-center justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 flex-1">
        <div>
          {title && <AlertTitle className="mb-0">{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {action}
        {dismissible && (
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-current"
            aria-label="Dismiss banner"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
};

export { 
  Alert, 
  AlertTitle, 
  AlertDescription,
  NotificationAlert,
  ToastAlert,
  BannerAlert,
  alertVariants 
};