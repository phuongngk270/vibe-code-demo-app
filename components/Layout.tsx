import { SignedIn, SignedOut, UserButton, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import Head from 'next/head';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { openSignIn } = useClerk();

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#101828] flex flex-col">
      <Head>
        <title>{title ? `${title} | Subscription Document Reviewer` : 'Subscription Document Reviewer'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/anduin-logo.svg" alt="Anduin" className="h-8 w-8" />
            <span className="font-semibold tracking-tight">Subscription Document Reviewer</span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#2A7DE1]">
              Home
            </Link>
            <Link href="/review" className="text-gray-500 hover:text-[#2A7DE1]">
              New Review
            </Link>
            <Link href="/history" className="text-gray-500 hover:text-[#2A7DE1]">
              History
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link href="/review" className="btn btn-primary">Start review</Link>
            </SignedIn>
            <SignedOut>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  openSignIn({
                    redirectUrl: '/review',
                    afterSignInUrl: '/review',
                  })
                }
              >
                Start review
              </button>
            </SignedOut>
              <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="flex-1 container-xl py-10">{children}</main>
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center text-sm text-gray-500">
          © {new Date().getFullYear()} Subscription Document Reviewer
        </div>
      </footer>
    </div>
  );
}
