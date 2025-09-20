import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Home() {
  return (
    <Card>
      <div className="text-center py-lg-5">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-ink-primary">
          Welcome to PDF QA Checker
        </h1>
      <p className="text-lg sm:text-xl text-ink-secondary mb-8 max-w-2xl mx-auto">
        Upload your PDF to detect typos and formatting issues with ease using AI.
        </p>
      <div className="flex justify-center space-x-4">
          <Link href="/review" legacyBehavior>
            <a>
              <Button variant="primary">Start New Review</Button>
            </a>
          </Link>
          <Link href="/history" legacyBehavior>
            <a>
              <Button variant="secondary">View History</Button>
            </a>
          </Link>
    </div>
      </div>
    </Card>
  );
}

