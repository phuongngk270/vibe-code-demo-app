import { supabase } from '@/lib/supabaseClient';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import type { AnalysisIssue } from '@/lib/review';

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
  return (
      <div className="card p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Analysis History</h1>
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
