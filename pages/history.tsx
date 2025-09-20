import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Toast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

// (Keep your existing AnalysisRecord type)
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
        setRecords(data as any);
      }
      setIsLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div>
      {error && <Toast message={error} variant="danger" onClose={() => setError(null)} />}
      <Card>
        <h1 className="text-2xl font-bold mb-6 text-ink-primary">Analysis History</h1>

        {isLoading && <p className="text-ink-secondary">Loading history...</p>}
        {!isLoading && error && (
          <div className="text-center py-8">
            <p className="text-danger mb-4">Failed to load analysis history.</p>
            <p className="text-ink-secondary">{error}</p>
          </div>
        )}

        {!isLoading && !error && records.length === 0 && (

          <div className="text-center py-8">
            <p className="text-ink-secondary mb-4">No analysis history found.</p>
            <Link href="/review" legacyBehavior>
              <a><Button variant="primary">Start a New Review</Button></a>
            </Link>
          </div>
        )}

        {!isLoading && !error && records.length > 0 && (
          <Table>
            <TableHead>
              <TableHeader>Created At</TableHeader>
              <TableHeader>File Name</TableHeader>
              <TableHeader>Issue Count</TableHeader>
              <TableHeader><span className="sr-only">View</span></TableHeader>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono">
                    {record.ai_result?.fileName || record.user_input}
                  </TableCell>
                  <TableCell>{record.ai_result?.summary?.issueCount ?? 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/history/${record.id}`} legacyBehavior>

                      <a><Button variant="ghost">View Details</Button></a>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

