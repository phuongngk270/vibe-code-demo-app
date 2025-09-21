import Layout from '@/components/Layout';
import { useState } from 'react';
import type { AnalysisResult, AnalysisIssue } from '@/lib/review';
import { FileUp, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Review() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="New Review | PDF QA Checker">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Upload your PDF</h2>
        <form onSubmit={handleSubmit}>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-bg">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label
                htmlFor="file-upload"
                className="mt-4 block font-medium text-primary cursor-pointer hover:underline"
              >
                {file ? 'Change file' : 'Choose a file'}
            </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept=".pdf"
                disabled={uploading}
              />
              <p className="mt-1 text-sm text-muted">
                {file ? file.name : 'PDF up to 10MB'}
              </p>
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className="mt-6 w-full btn btn-primary"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Analyzing...' : 'Analyze Document'}
            </button>
          </form>
            </div>

        {/* Results */}
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Results</h2>
          <div className="h-96 overflow-y-auto pr-2 -mr-2">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-md">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
    </div>
            )}
            {result && (
              <div>
                {result.issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="mt-4 font-medium text-lg">No issues found!</p>
                    <p className="text-sm">This document looks great.</p>
                  </div>
                ) : (
                  <IssuesTable issues={result.issues} />
                )}
              </div>
            )}
            {!result && !error && !uploading && (
              <div className="text-center text-muted h-full flex flex-col justify-center">
                <p>Analysis results will appear here.</p>
              </div>
            )}
            {uploading && (
              <div className="text-center text-muted h-full flex flex-col justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4">Analyzing your document...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function IssuesTable({ issues }: { issues: AnalysisIssue[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="p-3 text-left font-medium">Page</th>
            <th className="p-3 text-left font-medium">Type</th>
            <th className="p-3 text-left font-medium">Message</th>
            <th className="p-3 text-left font-medium">Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, i) => (
            <tr key={i}>
              <td className="p-3">{issue.page}</td>
              <td className="p-3 capitalize">{issue.type}</td>
              <td className="p-3">{issue.message}</td>
              <td className="p-3">
                <code className="p-1 font-mono bg-primarySoft text-primaryDark rounded">
                  {issue.suggestion}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

