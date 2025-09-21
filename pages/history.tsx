import Layout from '@/components/Layout';
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
    <Layout title="History | PDF QA Checker">
      <div className="bg-white rounded-acl shadow-elev-2 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Analysis History</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-subtle sticky top-0">
              <tr>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">File Name</th>
                <th className="p-3 text-left font-medium">Issues Found</th>
                <th className="p-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, i) => (
                <tr
                  key={req.id}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-subtle'}
                >
                  <td className="p-3">
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-medium">{req.user_input}</td>
                  <td className="p-3">
                    {req.ai_result?.summary?.issueCount ?? 0}
                  </td>
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
      </div>
    </Layout>
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


