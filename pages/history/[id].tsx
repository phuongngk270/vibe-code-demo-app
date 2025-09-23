import { supabase } from '@/lib/supabaseClient';
import type { AnalysisIssue } from '@/lib/review';
import type { GetServerSideProps } from 'next';
import React, { useMemo } from 'react';
import IssuesTable from '@/components/IssuesTable';

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



