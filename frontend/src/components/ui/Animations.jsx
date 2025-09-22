import React from 'react';
import { Transition } from '@headlessui/react';
import { cn } from '../../utils/cn';

// Enhanced page transition wrapper
export function PageTransition({ children, className }) {
  return (
    <Transition
      appear
      show={true}
      enter="transition-all duration-300 ease-out"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      className={cn("w-full", className)}
    >
      {children}
    </Transition>
  );
}

// Stagger animation for lists
export function StaggerContainer({ children, className, delay = 100 }) {
  return (
    <div className={cn("space-y-4", className)}>
      {React.Children.map(children, (child, index) => (
        <Transition
          appear
          show={true}
          enter="transition-all duration-300 ease-out"
          enterFrom="opacity-0 translate-x-4"
          enterTo="opacity-100 translate-x-0"
          style={{ transitionDelay: `${index * delay}ms` }}
        >
          {child}
        </Transition>
      ))}
    </div>
  );
}

// Slide in animation
export function SlideIn({ children, direction = 'left', className }) {
  const directions = {
    left: 'translate-x-4',
    right: '-translate-x-4',
    up: 'translate-y-4',
    down: '-translate-y-4'
  };

  return (
    <Transition
      appear
      show={true}
      enter="transition-all duration-300 ease-out"
      enterFrom={`opacity-0 ${directions[direction]}`}
      enterTo="opacity-100 translate-x-0 translate-y-0"
      className={className}
    >
      {children}
    </Transition>
  );
}

// Scale animation
export function ScaleIn({ children, className }) {
  return (
    <Transition
      appear
      show={true}
      enter="transition-all duration-200 ease-out"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      className={className}
    >
      {children}
    </Transition>
  );
}

// Fade transition
export function FadeTransition({ show, children, className }) {
  return (
    <Transition
      show={show}
      enter="transition-opacity duration-300 ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-200 ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      className={className}
    >
      {children}
    </Transition>
  );
}

// Loading skeleton with animations
export function SkeletonLoader({ lines = 3, className }) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

// Shimmer effect for cards
export function ShimmerCard({ className }) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-lg",
      "before:absolute before:inset-0 before:-translate-x-full",
      "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
      "before:animate-[shimmer_2s_infinite]",
      className
    )}>
      <div className="p-6 space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      </div>
    </div>
  );
}

// Bounce animation for interactions
export function BounceOnHover({ children, className }) {
  return (
    <div className={cn(
      "transition-transform duration-200 ease-out hover:scale-105 active:scale-95",
      className
    )}>
      {children}
    </div>
  );
}

// Pulse animation for status indicators
export function PulseIndicator({ color = 'green', size = 'sm' }) {
  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="relative">
      <div className={cn(
        "rounded-full animate-pulse",
        sizes[size],
        colors[color]
      )} />
      <div className={cn(
        "absolute inset-0 rounded-full animate-ping",
        sizes[size],
        colors[color],
        "opacity-75"
      )} />
    </div>
  );
}

// Progress bar with animation
export function AnimatedProgressBar({ progress, className }) {
  return (
    <div className={cn("w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2", className)}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

// Floating action button with animation
export function FloatingActionButton({ children, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg",
        "transition-all duration-200 ease-out transform hover:scale-110 hover:shadow-xl",
        "focus:outline-none focus:ring-4 focus:ring-blue-500/50",
        "active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
}

// Notification badge with animation
export function NotificationBadge({ count, className }) {
  if (!count || count === 0) return null;

  return (
    <div className={cn(
      "absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5",
      "flex items-center justify-center font-medium",
      "animate-bounce",
      className
    )}>
      {count > 99 ? '99+' : count}
    </div>
  );
}

// Ripple effect for buttons
export function withRipple(Component) {
  return React.forwardRef(function RippleComponent(props, ref) {
    const [ripples, setRipples] = React.useState([]);

    const createRipple = (event) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple = {
        x,
        y,
        size,
        id: Date.now()
      };

      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    };

    return (
      <Component
        {...props}
        ref={ref}
        onMouseDown={createRipple}
        style={{ position: 'relative', overflow: 'hidden', ...props.style }}
      >
        {props.children}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute bg-white/20 rounded-full animate-ping"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              pointerEvents: 'none'
            }}
          />
        ))}
      </Component>
    );
  });
}