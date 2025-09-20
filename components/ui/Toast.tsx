// components/ui/Toast.tsx
import React from 'react';

type ToastProps = {
  message: string;
  variant: 'success' | 'danger';
  onClose: () => void;
};

export const Toast = ({ message, variant, onClose }: ToastProps) => {
  const baseClasses = 'fixed top-5 right-5 w-full max-w-xs p-4 rounded-acl shadow-elev-3';
  const variantClasses = {
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`} role="alert">
      <div className="flex items-start">
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-acl p-1.5 inline-flex h-8 w-8 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
