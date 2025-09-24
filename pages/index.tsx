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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    <rect x="7" y="13" width="10" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
  </svg>
);

const ReviewIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25A8.966 8.966 0 0 1 18 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    <circle cx="19" cy="8" r="2" fill="currentColor" opacity="0.4" />
  </svg>
);

const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.06-9.75 1.5 1.5m1.5-1.5-1.5-1.5" />
    <rect x="6" y="14" width="12" height="2" rx="1" fill="currentColor" opacity="0.2" />
    <rect x="8" y="16.5" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10l4 3 4-3" />
    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
  </svg>
);
