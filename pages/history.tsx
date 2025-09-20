import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

type AnalysisRecord = {
  id: string;
  created_at: string;
  user_input: string;
  ai_result: {
    fileName: string;
    summary: {
      issueCount: number;
    };
  };
};

export default function HistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('demo_requests')
        .select('id, created_at, user_input, ai_result')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        setError(error.message);
      } else {
        setRecords(data);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Analysis History</h1>
          <div>
            <Link href="/" className="text-blue-500 hover:underline mr-4">Home</Link>
            <Link href="/review" className="text-blue-500 hover:underline">New Review</Link>
          </div>
        </div>

        {isLoading && <p>Loading history...</p>}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-800 border-red-400 text-red-700 dark:text-red-200 rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && records.length === 0 && (
          <p>No history yet.</p>
        )}

        {!isLoading && !error && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(record.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{record.ai_result?.fileName || record.user_input}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.ai_result?.summary?.issueCount ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link href={`/history/${record.id}`} className="text-blue-500 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
