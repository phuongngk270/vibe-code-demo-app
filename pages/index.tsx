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
          Our AI-powered tool scans your subscription documents for typos, formatting
          inconsistencies, and logic points requiring customer confirmation, ensuring professional
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

    <section aria-labelledby="how-it-works" className="mt-10">
      <h2 id="how-it-works" className="sr-only">How it works</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { t:'Upload sub-doc (PDF)', c:'Drop your subscription sub-doc to start.', Icon: UploadIcon },
          { t:'AI review', c:'We scan for inconsistencies, formatting issues & logic points.', Icon: ReviewIcon },
          { t:'Export drafting errors', c:'Download a clean, categorized issue list.', Icon: ExportIcon },
          { t:'Auto-draft email', c:'Generate a confirmation email with exact page refs.', Icon: MailIcon, beta:true },
        ].map((s, i) => (
          <li key={i} className="group rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur p-5 shadow-sm transition
                                 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="rounded-xl p-2 bg-gradient-to-br from-slate-50 to-blue-50">
                <s.Icon aria-hidden="true" className="h-6 w-6 text-blue-600" />
              </div>
              {s.beta && (
                <span aria-label="Beta feature" className="text-xs rounded-full px-2 py-0.5 bg-blue-600/10 text-blue-700">Beta</span>
              )}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{s.t}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.c}</p>
          </li>
        ))}
      </ul>
    </section>
      </div>
  );
}

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m0 0l-3-3m3 3l3-3" />
  </svg>
);

const ReviewIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
