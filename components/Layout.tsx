// components/Layout.tsx
import Link from 'next/link';
import Head from 'next/head';
import { inter } from '@/lib/font';

export default function Layout({ children, title = 'PDF QA Checker' }: { children: React.ReactNode, title?: string }) {
  return (
    <div className={`min-h-screen ${inter.variable}`}>
       <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <header className="bg-surface shadow-nav">
        <div className="container-xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="h-8 w-8 rounded-lgx bg-primary/10 flex items-center justify-center text-primary font-bold">
              QA
            </Link>
            <span className="font-semibold">PDF QA Checker</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-muted hover:text-text">Home</Link>
            <Link href="/review" className="text-muted hover:text-text">New Review</Link>
            <Link href="/history" className="text-muted hover:text-text">History</Link>
            <Link href="/review" className="btn btn-outline">Start review</Link>
          </nav>
        </div>
      </header>
      <main className="container-xl py-10">{children}</main>
      <footer className="mt-16 py-8 border-t border-border">
        <div className="container-xl text-sm text-muted">
        © {new Date().getFullYear()} PDF QA Checker
    </div>
      </footer>
    </div>
  );
}