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
      {/* Enhanced Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(-45deg, #F8FAFC, #EEF2FF, #DBEAFE, #F1F5F9, #E0E7FF)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite'
          }}
        ></div>

        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
          {/* Large floating circles */}
          <div
            className="absolute w-64 h-64 rounded-full opacity-20"
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              top: '10%',
              left: '85%',
              animation: 'floatSlow 20s ease-in-out infinite'
            }}
          ></div>
          <div
            className="absolute w-48 h-48 rounded-full opacity-15"
            style={{
              background: 'linear-gradient(45deg, #2563EB, #1D4ED8)',
              bottom: '20%',
              left: '5%',
              animation: 'floatMedium 16s ease-in-out infinite reverse'
            }}
          ></div>

          {/* Geometric triangles */}
          <div
            className="absolute w-32 h-32 opacity-10"
            style={{
              background: 'linear-gradient(60deg, #60A5FA, #A78BFA)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              top: '70%',
              right: '10%',
              animation: 'rotate 25s linear infinite'
            }}
          ></div>
          <div
            className="absolute w-24 h-24 opacity-10"
            style={{
              background: 'linear-gradient(120deg, #818CF8, #C084FC)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              top: '15%',
              left: '20%',
              animation: 'rotateReverse 30s linear infinite'
            }}
          ></div>

          {/* Hexagons */}
          <div
            className="absolute w-20 h-20 opacity-10"
            style={{
              background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              top: '40%',
              right: '25%',
              animation: 'float 18s ease-in-out infinite'
            }}
          ></div>

          {/* Wave patterns */}
          <svg
            className="absolute bottom-0 left-0 w-full h-32 opacity-15"
            style={{ animation: 'waveMove 12s ease-in-out infinite' }}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120L48,110C96,100,192,80,288,70C384,60,480,60,576,65C672,70,768,80,864,75C960,70,1056,50,1152,45C1248,40,1344,50,1392,55L1440,60L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              fill="url(#gradient1)"
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
          </svg>

          <svg
            className="absolute top-0 right-0 w-full h-24 opacity-10"
            style={{ animation: 'waveMoveReverse 15s ease-in-out infinite', transform: 'rotate(180deg)' }}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60L48,65C96,70,192,80,288,75C384,70,480,50,576,45C672,40,768,50,864,55C960,60,1056,70,1152,65C1248,60,1344,40,1392,35L1440,30L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
              fill="url(#gradient2)"
            />
            <defs>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2"/>
                <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Enhanced radial gradients */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 10%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)',
            animation: 'pulseGlow 10s ease-in-out infinite'
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
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.05);
          }
        }
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(10px) translateX(-15px);
          }
        }
        @keyframes floatMedium {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-30px) translateX(20px);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes rotateReverse {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }
        @keyframes waveMove {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(-20px);
          }
        }
        @keyframes waveMoveReverse {
          0%, 100% {
            transform: rotate(180deg) translateX(0px);
          }
          50% {
            transform: rotate(180deg) translateX(20px);
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
