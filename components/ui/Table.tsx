import React from 'react';

export const Table = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`overflow-x-auto border border-frame-border rounded-lg shadow-sm ${className}`}>
    <table className="min-w-full">{children}</table>
  </div>
);

export const TableHead = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <thead className={`bg-gray-50 sticky top-0 ${className}`}>
    <tr>{children}</tr>
  </thead>
);

export const TableHeader = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <th className={`px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider border-b border-frame-border ${className}`}>
    {children}
  </th>
);

export const TableBody = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tbody className={`bg-frame-bg-alt divide-y divide-frame-border ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tr className={`even:bg-gray-50 hover:bg-primary/10 transition-colors ${className}`}>{children}</tr>
);

export const TableCell = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <td className={`px-4 py-3 whitespace-nowrap text-base text-ink-primary ${className}`}>
    {children}
  </td>
);
