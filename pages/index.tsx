import Link from 'next/link';







import { Button } from '../components/ui/Button';
export default function Home() {
  return (





    <div className="text-center py-lg-6">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-ink-primary">
          Welcome to PDF QA Checker
        </h1>


      <p className="text-lg sm:text-xl text-ink-secondary mb-8 max-w-2xl mx-auto">
        Upload your PDF to detect typos and formatting issues with ease using AI.
        </p>





      <div className="flex justify-center space-x-4">
        <Link href="/review">
          <Button variant="primary">Start New Review</Button>
        </Link>

        <Link href="/history">
          <Button variant="secondary">View History</Button>
        </Link>
      </div>
    </div>
  );
}

