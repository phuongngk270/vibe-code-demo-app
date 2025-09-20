import { useState, FormEvent } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';

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

  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'typo':
      case 'punctuation':
        return 'warning';
      case 'formatting':
      case 'spacing':
      case 'capitalization':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div>
      {error && <Toast message={error} variant="danger" onClose={() => setError(null)} />}
      <Card>
        <h1 className="text-2xl font-bold mb-6 text-ink-primary">New PDF Review</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-base text-ink-secondary file:mr-4 file:py-2 file:px-4 file:rounded-acl file:border file:border-frame-border file:text-base file:font-semibold file:bg-frame-bg-alt file:text-ink-primary hover:file:bg-frame-border cursor-pointer"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !file}
            >
              {isLoading ? 'Analyzing...' : 'Analyze PDF'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Analysis for: <span className="font-mono">{result.fileName}</span></h2>
          <p className="mb-4 text-ink-secondary">Total issues found: <strong>{result.summary.issueCount}</strong></p>
          {result.issues.length > 0 ? (
            <Table>
              <TableHead>
                  <TableHeader>Page</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Message</TableHeader>
                  <TableHeader>Original</TableHeader>
                  <TableHeader>Suggestion</TableHeader>
                  <TableHeader>Location</TableHeader>
              </TableHead>
              <TableBody>
                {result.issues.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell>{issue.page}</TableCell>
                    <TableCell><Badge variant={getBadgeVariant(issue.type)}>{issue.type}</Badge></TableCell>
                    <TableCell>{issue.message}</TableCell>
                    <TableCell><span className="font-mono text-danger">{issue.original}</span></TableCell>
                    <TableCell><span className="font-mono text-success">{issue.suggestion}</span></TableCell>
                    <TableCell>{issue.locationHint}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-4 p-4 bg-success/20 text-success rounded-acl">
              No issues detected.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

