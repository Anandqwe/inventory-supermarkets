import React from 'react';
import { cn } from '../../utils/cn';

const SkipLink = ({ href = "#main-content", children = "Skip to main content", className, ...props }) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
        "bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
};

SkipLink.displayName = "SkipLink";

export { SkipLink };