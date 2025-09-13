import React from 'react';
import { Card } from './Card';
import { cn } from '../../utils/cn';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ 
  title,
  value,
  delta,
  deltaType = 'neutral',
  icon: Icon,
  trend,
  onClick,
  loading = false,
  className,
  format = 'number',
  currency = '₹',
  ...otherProps
}) => {
  const formatValue = (val) => {
    if (loading || val === undefined || val === null) return '...';
    
    switch (format) {
      case 'currency':
        return `${currency}${Number(val).toLocaleString('en-IN')}`;
      case 'percentage':
        return `${val}%`;
      default:
        return Number(val).toLocaleString('en-IN');
    }
  };

  const getDeltaColor = (type) => {
    switch (type) {
      case 'positive':
        return 'text-success-600 dark:text-success-400';
      case 'negative':
        return 'text-danger-600 dark:text-danger-400';
      default:
        return 'text-surface-600 dark:text-surface-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4" />;
      default:
        return <MinusIcon className="h-4 w-4" />;
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
      {...otherProps}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-600 dark:text-surface-400 truncate">
              {title}
            </p>
            <div className="mt-1 flex items-baseline">
              {loading ? (
                <div className="animate-pulse bg-surface-200 dark:bg-surface-700 h-8 w-24 rounded"></div>
              ) : (
                <p className="text-2xl font-semibold text-surface-900 dark:text-surface-100">
                  {formatValue(value)}
                </p>
              )}
            </div>
            
            {delta && (
              <div className={cn("mt-2 flex items-center text-sm", getDeltaColor(deltaType))}>
                {trend && (
                  <span className="mr-1">
                    {getTrendIcon()}
                  </span>
                )}
                <span>{delta}</span>
              </div>
            )}
          </div>
          
          {Icon && (
            <div className="flex-shrink-0">
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

StatCard.displayName = "StatCard";

export { StatCard };