import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const skeletonVariants = cva(
  "animate-pulse bg-surface-200 dark:bg-surface-700 rounded",
  {
    variants: {
      variant: {
        default: "",
        text: "h-4",
        title: "h-6",
        button: "h-10",
        avatar: "rounded-full",
        card: "h-24",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Skeleton = React.forwardRef(({ 
  className, 
  variant,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";

// Skeleton patterns for common layouts
const SkeletonCard = ({ className }) => (
  <div className={cn("p-5 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700", className)}>
    <Skeleton variant="title" className="mb-3 w-3/4" />
    <Skeleton variant="text" className="mb-2 w-full" />
    <Skeleton variant="text" className="mb-4 w-2/3" />
    <Skeleton variant="button" className="w-24" />
  </div>
);

const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="overflow-hidden bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
    {/* Header */}
    <div className="p-4 border-b border-surface-200 dark:border-surface-700">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b border-surface-200 dark:border-surface-700 last:border-b-0">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" className="flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} className="p-6">
        <div className="flex items-center">
          <Skeleton className="h-12 w-12 rounded-full mr-4" />
          <div className="flex-1">
            <Skeleton variant="text" className="mb-2 w-20" />
            <Skeleton variant="title" className="w-16" />
          </div>
        </div>
      </SkeletonCard>
    ))}
  </div>
);

// Text skeleton for paragraphs
const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        className={cn(
          i === lines - 1 ? "w-3/4" : "w-full"
        )} 
      />
    ))}
  </div>
);

// Dashboard skeleton layout
const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Stats */}
    <SkeletonStats count={4} />
    
    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard className="p-6 h-80" />
      <SkeletonCard className="p-6 h-80" />
    </div>
    
    {/* Table */}
    <SkeletonTable rows={8} columns={5} />
  </div>
);

// Form skeleton
const SkeletonForm = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
    ))}
    <div className="flex gap-2 pt-4">
      <Skeleton variant="button" className="w-20" />
      <Skeleton variant="button" className="w-16" />
    </div>
  </div>
);

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonStats, 
  SkeletonText,
  SkeletonDashboard,
  SkeletonForm,
  skeletonVariants 
};