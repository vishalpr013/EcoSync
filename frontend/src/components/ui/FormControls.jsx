import React from 'react';
import { Search, Upload, Loader } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary | secondary | danger | outline | ghost
  size = 'md', // sm | md | lg
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500 border border-transparent',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-transparent dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500 border border-transparent',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        ref={ref}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-950 border rounded-lg shadow-inner outline-none transition-all duration-150
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30' 
            : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/30'
          } dark:text-gray-100`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = React.forwardRef(({
  label,
  options = [],
  error,
  className = '',
  id,
  required,
  placeholder,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-950 border rounded-lg shadow-inner outline-none transition-all duration-150 appearance-none
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30' 
            : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-950/30'
          } dark:text-gray-100`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25rem',
          backgroundRepeat: 'no-repeat',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export const SearchBar = ({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200 dark:focus:bg-gray-950 dark:focus:ring-indigo-950/20"
        {...props}
      />
    </div>
  );
};

export const FileUpload = ({
  label,
  onChange,
  value,
  error,
  required,
  className = '',
  accept,
}) => {
  const fileInputRef = React.useRef(null);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      onChange(file);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <div
        onClick={handleBoxClick}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-5 cursor-pointer transition-all duration-150
          ${error
            ? 'border-red-400 bg-red-50/30 hover:bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/10'
            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-indigo-400 dark:border-gray-800 dark:bg-gray-900/20 dark:hover:border-indigo-500'
          }`}
      >
        <Upload className="w-7 h-7 text-gray-400 dark:text-gray-500 mb-2" />
        {value ? (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-xs">
              {typeof value === 'string' ? value.split('/').pop() : value.name}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              Click to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drag & drop file here, or click to upload
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Support PDF, images up to 5MB
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
};
