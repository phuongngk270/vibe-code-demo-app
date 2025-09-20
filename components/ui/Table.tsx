import React from 'react';

export const Table = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`overflow-x-auto border-b border-frame-border ${className}`}>
    <table className="min-w-full">{children}</table>
  </div>
);

export const TableHead = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <thead className={`bg-frame-bg sticky top-0 ${className}`}>
    <tr>{children}</tr>
  </thead>
);

export const TableHeader = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <th className={`px-4 py-2 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider border-b border-frame-border ${className}`}>
    {children}
  </th>
);

export const TableBody = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tbody className={`bg-frame-bg-alt divide-y divide-frame-border ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tr className={`even:bg-frame-bg ${className}`}>{children}</tr>
);

export const TableCell = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <td className={`px-4 py-2 whitespace-nowrap text-base text-ink-primary ${className}`}>
    {children}
  </td>
);
