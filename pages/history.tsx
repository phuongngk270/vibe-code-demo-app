import { supabase } from '@/lib/supabaseClient';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import type { AnalysisIssue } from '@/lib/review';
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';

type HistoryItem = {
  id: string;
  created_at: string;
  user_input: string;
  ai_result: {
    issues: AnalysisIssue[];
    summary: {
      issueCount: number;
    };
  };
};

type HistoryProps = {
  requests: HistoryItem[];
};

export default function History({ requests }: HistoryProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleClearHistory = async () => {
    setIsClearing(true);

    try {
      const response = await fetch('/api/clear-history', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear history');
      }

      // Refresh the page to show updated data
      router.reload();

    } catch (error: any) {
      console.error('Error clearing history:', error);
      alert(`Failed to clear history: ${error.message}`);
    } finally {
      setIsClearing(false);
      setShowConfirm(false);
    }
  };

  const confirmClearHistory = () => {
    setShowConfirm(true);
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/history" />
      </SignedOut>

      <SignedIn>
        <div className="card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Analysis History</h1>
            {requests.length > 0 && (
              <button
                onClick={confirmClearHistory}
                disabled={isClearing}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isClearing ? 'Clearing...' : 'Clear History'}
              </button>
            )}
          </div>
          {requests.length === 0 ? (
            <div className="text-center text-muted py-12">
              <p>No history found.</p>
              <p className="mt-2">
                <Link href="/review" className="btn btn-primary">
                  Start a new review
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">File Name</th>
                    <th className="p-3 text-left font-medium">Issues Found</th>
                    <th className="p-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="p-3">{new Date(req.created_at).toLocaleString()}</td>
                      <td className="p-3 font-medium">{req.user_input}</td>
                      <td className="p-3">{req.ai_result?.summary?.issueCount ?? 0}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/history/${req.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Clear All History
                  </h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Are you sure you want to clear all analysis history? This action cannot be undone and will permanently delete all {requests.length} historical record{requests.length !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelClear}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  disabled={isClearing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearing ? 'Clearing...' : 'Clear All History'}
                </button>
              </div>
            </div>
          </div>
        )}
      </SignedIn>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data, error } = await supabase
    .from('demo_requests')
    .select('id, created_at, user_input, ai_result')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching history:', error);
  }

  return {
    props: {
      requests: data ?? [],
    },
  };
};
