// components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = ({
  children,
  variant = 'primary',
  icon,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-acl px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary:
      'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary:
      'bg-frame-bg-alt text-ink-primary border border-frame-border hover:bg-frame-border focus:ring-primary',
    ghost: 'text-ink-primary hover:bg-frame-bg-alt focus:ring-primary',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      {children}
    </button>
  );
};
