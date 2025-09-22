import React from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

// Mobile-first responsive breakpoints hook
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState('mobile');
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({
        width,
        height: window.innerHeight
      });

      if (width >= 1280) {
        setBreakpoint('xl');
      } else if (width >= 1024) {
        setBreakpoint('lg');
      } else if (width >= 768) {
        setBreakpoint('md');
      } else if (width >= 640) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    windowSize,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'sm' || breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    width: windowSize.width,
    height: windowSize.height
  };
};

// Mobile navigation drawer
export const MobileDrawer = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = "" 
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-80 max-w-[80vw] bg-white dark:bg-slate-900 
        z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden ${className}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

// Responsive navigation component
export const ResponsiveNav = ({ 
  items, 
  currentPath, 
  onNavigate,
  logo,
  mobileTitle = "Menu"
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isMobile } = useBreakpoint();

  const handleNavigate = (path) => {
    onNavigate?.(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            {logo}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {items.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${currentPath === item.path
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                {item.icon && <item.icon className="inline-block w-4 h-4 mr-2" />}
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={mobileTitle}
      >
        <div className="py-2">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors
                ${currentPath === item.path
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              {item.icon && <item.icon className="w-5 h-5 mr-3" />}
              {item.label}
            </button>
          ))}
        </div>
      </MobileDrawer>
    </nav>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  className = ""
}) => {
  const gridCols = `
    grid-cols-${cols.mobile} 
    sm:grid-cols-${cols.sm} 
    md:grid-cols-${cols.md} 
    lg:grid-cols-${cols.lg} 
    xl:grid-cols-${cols.xl}
  `;

  return (
    <div className={`grid ${gridCols} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

// Mobile-optimized data table
export const ResponsiveTable = ({ 
  data, 
  columns, 
  onRowClick,
  mobileCardRenderer
}) => {
  const { isMobile } = useBreakpoint();

  if (isMobile && mobileCardRenderer) {
    return (
      <div className="space-y-3">
        {data.map((row, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            {mobileCardRenderer(row, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(row)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {columns.map((column) => (
                <td
                  key={column.accessor}
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100"
                >
                  {column.Cell 
                    ? column.Cell({ value: row[column.accessor], row })
                    : row[column.accessor]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Responsive modal that becomes full screen on mobile
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  className = ""
}) => {
  const { isMobile } = useBreakpoint();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`
          relative w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl
          ${isMobile 
            ? 'h-full max-h-screen rounded-none' 
            : `${sizeClasses[size]} max-h-[90vh]`
          }
          ${className}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Touch-friendly action sheet for mobile
export const ActionSheet = ({ 
  isOpen, 
  onClose, 
  actions, 
  title,
  cancelText = "Cancel"
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-xl">
        {title && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 text-center">
              {title}
            </h3>
          </div>
        )}

        <div className="py-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onPress?.();
                onClose();
              }}
              disabled={action.disabled}
              className={`
                w-full px-4 py-4 text-left text-base font-medium transition-colors
                ${action.destructive
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100'
                }
                ${action.disabled
                  ? 'text-slate-400 dark:text-slate-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              {action.icon && <action.icon className="inline-block w-5 h-5 mr-3" />}
              {action.title}
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="border-t border-slate-200 dark:border-slate-700 py-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-4 text-base font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
        </div>

        {/* Safe area spacer for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  );
};

// Responsive container with consistent padding
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = '7xl',
  className = "",
  noPadding = false
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      ${maxWidthClasses[maxWidth]} mx-auto
      ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8'}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default {
  useBreakpoint,
  MobileDrawer,
  ResponsiveNav,
  ResponsiveGrid,
  ResponsiveTable,
  ResponsiveModal,
  ActionSheet,
  ResponsiveContainer
};