import Link from 'next/link';
import React, { useState, FormEvent } from 'react';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
      setError(err.message ?? 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="container-xl py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">New PDF Review</h1>
          <div className="space-x-4">
            <Link href="/" className="link">Home</Link>
            <Link href="/history" className="link">History</Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isLoading}
              className="flex-grow"
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading || !file}>
              {isLoading ? 'Analyzing...' : 'Analyze PDF'}
            </button>
            </div>
        </form>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="card mt-6">
            <h2 className="text-xl font-semibold mb-2">
              Analysis for: <span className="font-mono">{result.fileName}</span>
            </h2>
            <p className="mb-4">
              Total issues found: <strong>{result.summary.issueCount}</strong>
            </p>
            {result.issues.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Type</th>
                      <th>Message</th>
                      <th>Original</th>
                      <th>Suggestion</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.issues.map((issue, idx) => (
                      <tr key={idx}>
                        <td>{issue.page}</td>
                        <td>{issue.type}</td>
                        <td>{issue.message}</td>
                        <td className="font-mono text-red-600">{issue.original}</td>
                        <td className="font-mono text-green-600">{issue.suggestion}</td>
                        <td className="text-muted">{issue.locationHint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-success mt-4">No issues detected.</div>
            )}
          </div>
        )}
      </div>
  );
}

