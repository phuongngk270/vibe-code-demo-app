import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabaseClient';
import type { AnalysisIssue } from '@/lib/review';
import type { GetServerSideProps } from 'next';

type DetailsProps = {
  request: {
    id: string;
    created_at: string;
    user_input: string;
    ai_result: {
      fileName: string;
      issues: AnalysisIssue[];
    };
  };
};

export default function Details({ request }: DetailsProps) {
  return (
    <Layout title={`Details for ${request.user_input}`}>
      <div className="bg-white rounded-acl shadow-elev-2 p-6 md:p-8">
        <h1 className="text-2xl font-bold">
          Analysis for{' '}
          <span className="text-primary">{request.ai_result.fileName}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Analyzed on {new Date(request.created_at).toLocaleString()}
        </p>

        <div className="mt-8">
          {request.ai_result.issues.length > 0 ? (
            <IssuesTable issues={request.ai_result.issues} />
          ) : (
            <p>No issues were found in this document.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

function IssuesTable({ issues }: { issues: AnalysisIssue[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-subtle sticky top-0">
          <tr>
            <th className="p-3 text-left font-medium">Page</th>
            <th className="p-3 text-left font-medium">Type</th>
            <th className="p-3 text-left font-medium">Message</th>
            <th className="p-3 text-left font-medium">Original</th>
            <th className="p-3 text-left font-medium">Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-subtle'}>
              <td className="p-3">{issue.page}</td>
              <td className="p-3 capitalize">{issue.type}</td>
              <td className="p-3">{issue.message}</td>
              <td className="p-3 font-mono text-red-700">
                <code className="bg-red-50 p-1 rounded">{issue.original}</code>
              </td>
              <td className="p-3 font-mono text-green-800">
                <code className="bg-green-50 p-1 rounded">
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const { data, error } = await supabase
    .from('demo_requests')
    .select('id, created_at, user_input, ai_result')
    .eq('id', id)
    .single();

  if (error || !data) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      request: data,
    },
  };
};

