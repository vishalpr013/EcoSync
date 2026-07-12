import React from 'react';
import { getStatusBadgeClass } from '../../utils/helpers';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export const Card = ({
  children,
  className = '',
  glass = false,
  onClick,
  ...props
}) => {
  const baseStyle = 'rounded-xl border border-gray-200/80 bg-white p-5 transition-all duration-200 shadow-sm';
  const glassStyle = 'rounded-xl border border-white/20 bg-white/70 backdrop-blur-md dark:bg-gray-900/60 dark:border-gray-800/40 p-5 shadow-sm';
  const darkClasses = glass ? '' : 'dark:bg-gray-950 dark:border-gray-800/60';
  const clickClasses = onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-950' : '';

  return (
    <div
      onClick={onClick}
      className={`${glass ? glassStyle : baseStyle} ${darkClasses} ${clickClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge = ({
  children,
  color = 'indigo', // indigo | green | red | gray | yellow
  className = '',
  ...props
}) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50',
    green: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900/50',
    red: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50',
    gray: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-900/50',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900/50',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusBadgeClass(status)} ${className}`}>
      {status}
    </span>
  );
};

export const Table = ({
  columns = [], // Array of { header, key, render }
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto w-full border border-gray-200/80 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-200/80 dark:border-gray-800">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <div className="flex justify-center items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center">
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/20 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-sm ${className}`}>
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-350 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-350 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing Page <span className="font-semibold text-gray-700 dark:text-gray-200">{page}</span> of{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-250 bg-white dark:bg-gray-900 dark:border-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-3.5 py-2 border text-sm font-medium ${
                    isCurrent
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-500 dark:text-indigo-400'
                      : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-500 hover:bg-gray-55 dark:hover:bg-gray-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-250 bg-white dark:bg-gray-900 dark:border-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-55 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export const EmptyState = ({
  message = 'No records found',
  description = 'There are no items matching this list at the moment.',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2.5" />
      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{message}</h3>
      <p className="text-xs text-gray-400 mt-1 max-w-sm">{description}</p>
    </div>
  );
};
