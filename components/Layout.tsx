import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function Layout({ children, title = 'PDF QA Checker' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="bg-frame min-h-screen">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-primary">
                PDF QA Checker
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/review" className="text-[#2C3E94] hover:underline font-medium">
                New Review
              </Link>
              <Link href="/history" className="text-[#2C3E94] hover:underline font-medium">
                History
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </div>
    </>
  );
}
