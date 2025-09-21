import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <div className="text-center py-20">
        <h1 className="text-3xl md:text-4xl font-bold">
          Catch errors before they cost you.
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Our AI-powered tool scans your PDF documents for typos, formatting
          inconsistencies, and other common issues, ensuring professional quality
          every time.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/review"
            className="bg-primary text-white rounded-md h-9 px-4 inline-flex items-center hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Start New Review
          </Link>
          <Link
            href="/history"
            className="bg-white text-primary border border-primary/20 rounded-md h-9 px-4 inline-flex items-center hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            View History
          </Link>
    </div>
      </div>
    </Layout>
  );
}
























