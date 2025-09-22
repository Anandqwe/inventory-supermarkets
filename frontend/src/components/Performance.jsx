import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Higher-order component for React.memo with custom comparison
export const withMemo = (Component, propsAreEqual) => {
  return memo(Component, propsAreEqual);
};

// Optimized list item component for large lists
export const OptimizedListItem = memo(({ 
  item, 
  index, 
  onSelect, 
  isSelected, 
  renderItem,
  className = ""
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(item, index);
  }, [onSelect, item, index]);

  const memoizedContent = useMemo(() => {
    return renderItem ? renderItem(item, index) : item;
  }, [item, index, renderItem]);

  return (
    <div 
      className={`${className} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {memoizedContent}
    </div>
  );
});

// Virtual scrolling component for large datasets
export const VirtualizedList = memo(({ 
  items, 
  itemHeight = 50, 
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = ""
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const containerScrollTop = scrollTop;
    const startIndex = Math.max(0, Math.floor(containerScrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((containerScrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex + 1).map((item, index) => ({
        item,
        index: startIndex + index
      }))
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleItems.startIndex * itemHeight;

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.items.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Debounced input component
export const DebouncedInput = memo(({ 
  value, 
  onChange, 
  delay = 300, 
  ...props 
}) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange?.(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, onChange, delay, value]);

  const handleChange = useCallback((e) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
});

// Optimized image component with lazy loading
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  placeholder, 
  className = "",
  ...props 
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const imgRef = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            const img = new Image();
            img.onload = () => {
              setLoaded(true);
              if (imgRef.current) {
                imgRef.current.src = src;
              }
            };
            img.onerror = () => setError(true);
            img.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  if (error) {
    return (
      <div className={`bg-slate-200 dark:bg-slate-700 flex items-center justify-center ${className}`}>
        <span className="text-slate-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && placeholder && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
    </div>
  );
});

// Lazy loading wrapper with suspense
export const LazyWrapper = ({ children, fallback }) => {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

// Performance monitoring hooks
export const usePerformanceMonitor = (componentName) => {
  React.useEffect(() => {
    const mark = `${componentName}-mount`;
    performance.mark(mark);

    return () => {
      const measure = `${componentName}-lifecycle`;
      performance.mark(`${componentName}-unmount`);
      performance.measure(measure, mark, `${componentName}-unmount`);
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        const entries = performance.getEntriesByName(measure);
        if (entries.length > 0) {
          console.log(`${componentName} lifecycle: ${entries[0].duration.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName]);
};

// Throttled scroll hook
export const useThrottledScroll = (callback, delay = 100) => {
  const [scrollY, setScrollY] = React.useState(0);
  const throttleTimer = React.useRef();

  React.useEffect(() => {
    const handleScroll = () => {
      if (throttleTimer.current) {
        return;
      }

      throttleTimer.current = setTimeout(() => {
        const currentScrollY = window.scrollY;
        setScrollY(currentScrollY);
        callback?.(currentScrollY);
        throttleTimer.current = null;
      }, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [callback, delay]);

  return scrollY;
};

// Optimized table row component
export const OptimizedTableRow = memo(({ 
  row, 
  columns, 
  onRowClick, 
  isSelected,
  className = ""
}) => {
  const handleClick = useCallback(() => {
    onRowClick?.(row);
  }, [onRowClick, row]);

  const renderedCells = useMemo(() => {
    return columns.map((column) => {
      const value = column.accessor ? row[column.accessor] : '';
      const content = column.Cell ? column.Cell({ value, row }) : value;
      
      return (
        <td key={column.id || column.accessor} className={column.className}>
          {content}
        </td>
      );
    });
  }, [row, columns]);

  return (
    <tr
      className={`${className} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer`}
      onClick={handleClick}
    >
      {renderedCells}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for row optimization
  return (
    prevProps.row === nextProps.row &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.columns === nextProps.columns
  );
});

// Bundle splitting utilities
export const createLazyComponent = (importFunc, fallback) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Memory leak prevention hook
export const useCleanup = () => {
  const cleanupFunctions = React.useRef([]);

  const addCleanup = useCallback((fn) => {
    cleanupFunctions.current.push(fn);
  }, []);

  React.useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.error('Cleanup function error:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return addCleanup;
};

// Performance measurement component
export const PerformanceProfiler = ({ id, children, onRender }) => {
  return (
    <React.Profiler
      id={id}
      onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Performance Profile:', {
            id,
            phase,
            actualDuration: `${actualDuration.toFixed(2)}ms`,
            baseDuration: `${baseDuration.toFixed(2)}ms`,
            startTime: `${startTime.toFixed(2)}ms`,
            commitTime: `${commitTime.toFixed(2)}ms`
          });
        }
        
        onRender?.({
          id,
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime
        });
      }}
    >
      {children}
    </React.Profiler>
  );
};

export default {
  withMemo,
  OptimizedListItem,
  VirtualizedList,
  DebouncedInput,
  OptimizedImage,
  LazyWrapper,
  usePerformanceMonitor,
  useThrottledScroll,
  OptimizedTableRow,
  createLazyComponent,
  useCleanup,
  PerformanceProfiler
};