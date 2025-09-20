// components/ui/AppShell.tsx
import React from 'react';
import Link from 'next/link';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-frame-bg-alt text-ink-primary min-h-screen text-base">
      <header className="bg-frame-bg border-b border-frame-border sticky top-0 z-10">
        <nav className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold">PDF Review</Link>
          <div>
            <Link href="/review" className="text-ink-secondary hover:text-primary mr-4">New Review</Link>
            <Link href="/history" className="text-ink-secondary hover:text-primary">History</Link>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
};
