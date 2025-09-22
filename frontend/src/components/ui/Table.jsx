import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const tableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
      variant: {
        default: "",
        striped: "[&_tbody_tr:nth-child(odd)]:bg-surface-50 dark:[&_tbody_tr:nth-child(odd)]:bg-surface-800",
        bordered: "border border-border",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn("bg-surface-50 dark:bg-surface-800", className)} 
    {...props} 
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-surface-50 dark:bg-surface-800 font-medium", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-surface-200 dark:border-surface-700 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50 data-[state=selected]:bg-surface-100 dark:data-[state=selected]:bg-surface-800",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-surface-500 dark:text-surface-400 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-surface-500 dark:text-surface-400", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

// Enhanced DataTable Component
const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false,
  emptyMessage = "No data available",
  className,
  stickyHeader = false,
  striped = true,
  hoverable = true,
  sortable = false,
  onSort,
  sortField,
  sortDirection,
}) => {
  const [sortConfig, setSortConfig] = React.useState({
    field: sortField,
    direction: sortDirection || 'asc'
  });

  const handleSort = (field) => {
    if (!sortable) return;
    
    const direction = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, direction });
    onSort?.(field, direction);
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
        <Table className={className}>
          <TableHeader className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  <div className="animate-pulse bg-surface-200 dark:bg-surface-700 h-4 rounded w-24"></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <div className="animate-pulse bg-surface-200 dark:bg-surface-700 h-4 rounded w-full"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-8 text-center">
        <div className="text-surface-500 dark:text-surface-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
      <Table className={className}>
        <TableHeader className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={cn(
                  column.sortable && sortable ? 'cursor-pointer select-none hover:bg-surface-100 dark:hover:bg-surface-700' : '',
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                )}
                onClick={() => column.sortable && handleSort(column.field)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && sortable && getSortIcon(column.field)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow 
              key={row.id || rowIndex}
              className={cn(
                striped && rowIndex % 2 === 1 ? 'bg-surface-50 dark:bg-surface-900/50' : '',
                hoverable ? 'hover:bg-surface-50 dark:hover:bg-surface-800/50' : ''
              )}
            >
              {columns.map((column, colIndex) => (
                <TableCell 
                  key={colIndex}
                  className={cn(
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  )}
                >
                  {column.render ? column.render(row[column.field], row, rowIndex) : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  DataTable,
  tableVariants,
};