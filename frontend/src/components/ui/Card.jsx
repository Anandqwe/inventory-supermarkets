import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  "rounded-lg border bg-white dark:bg-amoled-card shadow-sm border-surface-200 dark:border-amoled-border transition-colors dark:text-amoled-primary",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        default: "p-5",
        lg: "p-6",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        default: "shadow-md dark:shadow-amoled-md",
        lg: "shadow-lg dark:shadow-amoled-lg",
      }
    },
    defaultVariants: {
      padding: "default",
      shadow: "default",
    },
  }
);

const Card = React.forwardRef(({ 
  className, 
  padding,
  shadow,
  children,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ padding, shadow, className }))}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

// Card Header Component
const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-surface-200", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

// Card Title Component
const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-surface-900", className)}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

// Card Description Component
const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-surface-600", className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

// Card Content Component
const CardContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

// Card Footer Component
const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-5 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  cardVariants 
};