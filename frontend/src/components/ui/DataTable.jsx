import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Button } from './Button';
import { cn } from '../../utils/cn';

const DataTable = ({
  data,
  columns,
  pagination,
  sorting,
  rowSelection,
  onPaginationChange,
  onSortingChange,
  onRowSelectionChange,
  pageCount,
  totalRows,
  loading = false,
  className,
  searchKey, // Extract searchKey to prevent it from being passed to DOM
  ...domProps // Rename props to domProps for clarity
}) => {
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      pagination,
      sorting,
      rowSelection: rowSelection || {},
    },
    onPaginationChange,
    onSortingChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: pageCount !== undefined,
    manualSorting: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const handleRowSelectionChange = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      const newSelection = updaterOrValue(rowSelection || {});
      const selectedRows = data.filter((_, index) => newSelection[index]);
      onRowSelectionChange?.(selectedRows);
    } else {
      const selectedRows = data.filter((_, index) => updaterOrValue[index]);
      onRowSelectionChange?.(selectedRows);
    }
  };

  return (
    <div className={cn("space-y-4", className)} {...domProps}>
      {/* Table */}
      <div className="rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 dark:bg-surface-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider",
                        header.column.getCanSort() && "cursor-pointer select-none hover:bg-surface-100 dark:hover:bg-surface-700"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUpIcon 
                              className={cn(
                                "h-3 w-3",
                                header.column.getIsSorted() === 'asc' 
                                  ? "text-blue-600" 
                                  : "text-surface-300 dark:text-surface-600"
                              )} 
                            />
                            <ChevronDownIcon 
                              className={cn(
                                "h-3 w-3 -mt-1",
                                header.column.getIsSorted() === 'desc' 
                                  ? "text-blue-600" 
                                  : "text-surface-300 dark:text-surface-600"
                              )} 
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-surface-900 divide-y divide-surface-200 dark:divide-surface-700">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors",
                      row.getIsSelected() && "bg-blue-50 dark:bg-blue-950"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap text-sm text-surface-900 dark:text-surface-100"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-surface-500 dark:text-surface-400"
                  >
                    {loading ? "Loading..." : "No results found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
          <span>
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows || 0)} of{' '}
            {totalRows || 0} results
          </span>
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span className="text-blue-600 dark:text-blue-400">
              ({table.getFilteredSelectedRowModel().rows.length} selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              <span className="text-sm text-surface-600 dark:text-surface-400">Page</span>
              <input
                type="number"
                value={pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="w-12 px-2 py-1 text-sm border border-surface-300 dark:border-surface-700 rounded bg-white dark:bg-surface-800"
              />
              <span className="text-sm text-surface-600 dark:text-surface-400">
                of {table.getPageCount()}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <select
            value={pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="px-3 py-1 text-sm border border-surface-300 dark:border-surface-700 rounded bg-white dark:bg-surface-800"
          >
            {[10, 25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export { DataTable };