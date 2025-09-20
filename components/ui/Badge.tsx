import React from 'react';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'reference' | 'numbering';
};

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium';
  const variantClasses = {
    default: 'bg-frame-border text-ink-secondary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    reference: 'bg-warning/20 text-warning',
    numbering: 'bg-warning/20 text-warning',
  };

  return <span className={`${baseClasses} ${variantClasses[variant}`}>{children}</span>;
};
};

