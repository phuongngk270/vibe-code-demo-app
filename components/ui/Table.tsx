// components/ui/Table.tsx
import React from 'react';

export const Table = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-frame-border">{children}</table>
  </div>
);

export const TableHead = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <thead className={`bg-frame-bg-alt sticky top-0 ${className}`}>
    <tr>{children}</tr>
  </thead>
);

export const TableHeader = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const TableBody = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tbody className={`bg-frame-bg divide-y divide-frame-border ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tr className={`even:bg-frame-bg-alt ${className}`}>{children}</tr>
);

export const TableCell = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-base text-ink-primary ${className}`}>
    {children}
  </td>
);

