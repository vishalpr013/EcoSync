import React, { useEffect } from 'react';
import { X, Filter, RefreshCw } from 'lucide-react';
import { Button } from './FormControls';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg', // max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto max-h-[70vh] dark:text-gray-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const Loader = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading EcoSync...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-950/80 backdrop-blur-[1px]">
        {spinner}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{spinner}</div>;
};

export const FilterPanel = ({
  isOpen = false,
  onClear,
  onApply,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-full border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
      {children}
      <div className="md:col-span-3 flex justify-end gap-2.5 pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
        {onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear Filters
          </Button>
        )}
        {onApply && (
          <Button variant="primary" size="sm" onClick={onApply}>
            Apply Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export const Toast = ({
  message,
  type = 'info', // info | success | error
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const backgrounds = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg border border-transparent/10 ${backgrounds[type]} animate-in slide-in-from-bottom duration-250`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="p-0.5 rounded-md hover:bg-black/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
