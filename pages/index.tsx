import Link from 'next/link';
import { Button } from '../components/ui/Button';
export default function Home() {
  return (
    <div className="text-center py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-ink-primary tracking-tight">
        Your AI-Powered PDF Proofreader
      </h1>
      <p className="text-lg sm:text-xl text-ink-secondary mb-8 max-w-2xl mx-auto">
        Automatically detect typos, formatting errors, and other inconsistencies in your PDF documents. Save time and ensure your work is flawless.
      </p>
      <div className="flex justify-center space-x-4">
          <Link href="/review" legacyBehavior>
            <a>
            <Button variant="primary">Start a New Review</Button>
            </a>
          </Link>
          <Link href="/history" legacyBehavior>
            <a>
            <Button variant="secondary">View Analysis History</Button>
            </a>
          </Link>
    </div>
      </div>
  );
}

