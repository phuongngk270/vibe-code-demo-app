import Link from 'next/link';
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs';

export default function Home() {
  const { openSignIn } = useClerk();

  return (
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold tracking-tight">
          Catch errors before they cost you.
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Our AI-powered tool scans your PDF documents for typos, formatting
          inconsistencies, and other common issues, ensuring professional
          quality every time.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          {/* Signed-in users see direct links */}
          <SignedIn>
            <Link href="/review" className="btn btn-primary">
              Start New Review
            </Link>
            <Link href="/history" className="btn btn-outline">
              View History
            </Link>
          </SignedIn>

          {/* Signed-out users see buttons that trigger sign-in */}
          <SignedOut>
            <button
              className="btn btn-primary"
              onClick={() => openSignIn({ redirectUrl: '/review', afterSignInUrl: '/review' })}
            >
              Start New Review
            </button>
            <button
              className="btn btn-outline"
              onClick={() => openSignIn({ redirectUrl: '/history', afterSignInUrl: '/history' })}
            >
              View History
            </button>
          </SignedOut>
    </div>
      </div>
  );
}
