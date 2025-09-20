import { useState, FormEvent } from 'react';
import Link from 'next/link';

// Type definition for the API response data
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

export default function ReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Something went wrong');
      }

      setResult(responseData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">PDF Review</h1>
            <div>
                <Link href="/" className="text-blue-500 hover:underline mr-4">Home</Link>
                <Link href="/history" className="text-blue-500 hover:underline">History</Link>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full disabled:bg-gray-400"
              disabled={isLoading || !file}
            >
              {isLoading ? 'Analyzing...' : 'Analyze PDF'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-800 border border-red-400 text-red-700 dark:text-red-200 rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Analysis for: <span className="font-mono">{result.fileName}</span></h2>
            <p className="mb-4">Total issues found: <strong>{result.summary.issueCount}</strong></p>

            {result.issues.length > 0 ? (
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
              <p className="mt-4 p-4 bg-green-100 dark:bg-green-800 border border-green-400 text-green-700 dark:text-green-200 rounded-md">
                No issues detected.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
