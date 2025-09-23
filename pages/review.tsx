import React, { useState, FormEvent } from 'react';
import IssuesTable from '@/components/IssuesTable';

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
    <>
        <h1 className="text-3xl font-bold mb-6">New PDF Review</h1>
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

        {result?.issues && (
            <IssuesTable issues={result.issues} />
        )}
    </>
  );
}

