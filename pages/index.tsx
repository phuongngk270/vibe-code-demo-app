import Link from 'next/link';
import { Geist } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} font-sans flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}
    >
      <main className="text-center p-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Welcome to PDF QA Checker
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
          Upload your PDF to detect typos and formatting issues with ease.
        </p>
        <Link
          href="/review"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
        >
          Go to Review Page
        </Link>
      </main>
    </div>
  );
}

