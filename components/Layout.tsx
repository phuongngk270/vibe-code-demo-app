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
    <div className="min-h-screen text-[#101828] flex flex-col relative">
      <Head>
        <title>{title ? `${title} | Subscription Document Reviewer` : 'Subscription Document Reviewer'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(-45deg, #F5F7FB, #EBF0F9, #E0E7FF, #F0F3FA)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 12s ease infinite'
          }}
        ></div>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
            animation: 'pulseGlow 8s ease-in-out infinite'
          }}
        ></div>
      </div>
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.02);
          }
        }
      `}</style>
      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/anduin-logo.png" alt="Anduin" className="h-8 w-8" />
            <span className="font-semibold tracking-tight">Subscription Document Reviewer</span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#2A7DE1]">
              Home
            </Link>
            <Link href="/review" className="text-gray-500 hover:text-[#2A7DE1]">
              New Review
            </Link>
            {/* History nav item */}
            <SignedIn>
              <Link href="/history" className="text-gray-500 hover:text-[#2A7DE1]">
                History
              </Link>
            </SignedIn>
            <SignedOut>
              <button
                type="button"
                className="text-gray-500 hover:text-[#2A7DE1]"
                onClick={(e) => {
                  e.preventDefault();
                  openSignIn({ redirectUrl: '/history', afterSignInUrl: '/history' });
                }}
              >
                History
              </button>
            </SignedOut>
          </nav>
          <div className="flex items-center gap-4">
            {/* Signed-in: show Start review link + avatar */}
            <SignedIn>
              <div className="flex items-center gap-4">
                <Link href="/review" className="btn btn-primary">Start review</Link>
                <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
              </div>
            </SignedIn>

            {/* Signed-out: show Log in button (opens Clerk) */}
            <SignedOut>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  openSignIn({
                    redirectUrl: '/history',     // where the user wanted to go when they clicked History
                    afterSignInUrl: '/history',  // fallback for older Clerk versions
                  })
                }
              >
                Log in
              </button>
            </SignedOut>
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
    </div>
  );
}
