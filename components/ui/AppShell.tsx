import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const router = useRouter();
  const isActive = router.pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive ? 'text-primary bg-primary/10' : 'text-ink-secondary hover:text-primary hover:bg-primary/5'
      }`}
    >
      {children}
    </Link>
  );
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-frame-bg text-ink-primary min-h-screen text-base font-sans">
      <header className="bg-frame-bg-alt border-b border-frame-border sticky top-0 z-10 shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            QA Checker
          </Link>
          <div className="flex items-center space-x-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/review">New Review</NavLink>
            <NavLink href="/history">History</NavLink>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
};
