// components/ui/Card.tsx
import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div
      className={`bg-frame-bg text-ink-primary rounded-acl shadow-elev-2 border border-frame-border p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
};

