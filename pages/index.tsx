import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold">
          Catch errors before they cost you.
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Our AI-powered tool scans your PDF documents for typos, formatting
          inconsistencies, and other common issues, ensuring professional quality
          every time.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/review" className="btn btn-primary">
            Start New Review
          </Link>
          <Link href="/history" className="btn btn-outline">
            View History
          </Link>
    </div>
      </div>
    </Layout>
  );
}




