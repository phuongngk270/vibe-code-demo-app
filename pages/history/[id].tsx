import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

type Issue = {
  page: number;
  type: string;
  message: string;
  original: string;
  suggestion: string;
  locationHint: string;
};

type AnalysisResult = {
  fileName: string;
  issues: Issue[];
  summary: {
    issueCount: number;
    pagesAffected: number[];
  };
};

type AnalysisRecord = {
  id: string;
  created_at: string;
  user_input: string | null;
  ai_result: AnalysisResult | null;
};

export default function HistoryDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchRecord = async () => {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('demo_requests')
          .select('id, created_at, user_input, ai_result')
          .eq('id', id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setRecord(data);
        }
        setIsLoading(false);
      };

      fetchRecord();
    }
  }, [id]);

  const result = record?.ai_result;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Analysis Details</h1>
          <div>
            <Link href="/history" className="text-blue-500 hover:underline mr-4">Back to History</Link>
            <Link href="/review" className="text-blue-500 hover:underline">New Review</Link>
          </div>
        </div>

        {isLoading && <p>Loading details...</p>}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-800 border-red-400 text-red-700 dark:text-red-200 rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Analysis for: <span className="font-mono">{result.fileName}</span></h2>
            <p className="mb-4">Total issues found: <strong>{result.summary.issueCount}</strong></p>

            {result.issues && result.issues.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {result.issues.map((issue, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{issue.page}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{issue.type}</td>
                        <td className="px-6 py-4 whitespace-normal">{issue.message}</td>
                        <td className="px-6 py-4 whitespace-normal font-mono text-red-500">{issue.original}</td>
                        <td className="px-6 py-4 whitespace-normal font-mono text-green-500">{issue.suggestion}</td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{issue.locationHint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 p-4 bg-green-100 dark:bg-green-800 border-green-400 text-green-700 dark:text-green-200 rounded-md">
                No issues were detected in this analysis.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

