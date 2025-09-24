import { supabase } from '@/lib/supabaseClient';
import type { AnalysisIssue } from '@/lib/review';
import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';
import IssuesTable from '@/components/IssuesTable';
import EmailPreview from '@/components/EmailPreview';
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import type { EmailGenerationResult, Customer, Fund, Issue as EmailIssue } from '../../lib/email';

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

// Mock Data: Replace with your actual data from props or state
const mockCustomer: Customer = { name: "Acme GP", timezone: "America/New_York", isExistingCustomer: true };
const mockFunds: Fund[] = [{fullName:"Acme Growth Fund II, L.P.", shortName:"the Fund"}];

export default function Details({ request }: DetailsProps) {
  const [emailResult, setEmailResult] = useState<EmailGenerationResult | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateEmail = async () => {
    if (!request.ai_result.issues) {
        return;
    }

    setIsGeneratingEmail(true);
    setError(null);

    try {
        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: mockCustomer,
                funds: mockFunds,
                issues: convertToEmailIssues(request.ai_result.issues),
                typos: [],
                expectedDate: new Date().toISOString().split('T')[0],
            }),
        });

        const emailData = await response.json();

        if (!response.ok) {
            throw new Error(emailData.error || 'Something went wrong');
        }

        setEmailResult(emailData);
    } catch (err: any) {
        console.error('Error generating email:', err);
        setError(err.message ?? 'Unexpected error');
    } finally {
        setIsGeneratingEmail(false);
    }
  };

  const handleSendEmail = async (recipientEmail: string) => {
    if (!emailResult) return;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          emailResult
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      console.log('Email sent successfully:', result);

      if (result.demo) {
        alert(`Demo Mode: Email content logged to server console.\n\n${result.message}\n\nRecipient: ${recipientEmail}`);
      } else {
        alert(`Email sent successfully to ${recipientEmail}!`);
      }

      setEmailResult(null);
    } catch (error: any) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    }
  };

  const handleCloseEmailPreview = () => {
    setEmailResult(null);
  };

  // Convert analysis issues to email issues format
  const convertToEmailIssues = (analysisIssues: AnalysisIssue[]): EmailIssue[] => {
    return analysisIssues.map(issue => ({
      category: issue.type,
      sectionTitle: issue.message,
      pageRef: `p. ${issue.page}`,
      needsUpdatedPDF: issue.suggestion.toLowerCase().includes('pdf') ||
                       issue.suggestion.toLowerCase().includes('document') ||
                       issue.suggestion.toLowerCase().includes('update')
    }));
  };
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl={typeof window !== 'undefined' ? window.location.pathname : '/history'} />
      </SignedOut>

      <SignedIn>
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
                <>
                  <IssuesTable issues={request.ai_result.issues} />
                  <div className="mt-8 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Generate Email from History
                          </h3>
                          <p className="text-sm text-gray-600 mb-0">
                            {request.ai_result.issues.length} issue{request.ai_result.issues.length !== 1 ? 's' : ''} found in this historical review. Generate a professional email to send to the customer.
                          </p>
                          {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                          )}
                        </div>
                        <div className="ml-6">
                          <button
                            onClick={handleGenerateEmail}
                            disabled={isGeneratingEmail}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                          >
                            {isGeneratingEmail ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Email...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Generate Email
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>No issues were found in this document.</p>
              )}
            </div>

            {emailResult && (
              <EmailPreview
                result={emailResult}
                issues={request.ai_result.issues ? convertToEmailIssues(request.ai_result.issues) : []}
                typos={[]}
                onSend={handleSendEmail}
                onRegenerate={handleGenerateEmail}
                onClose={handleCloseEmailPreview}
                defaultRecipientEmail={mockCustomer.name.toLowerCase().replace(/\s+/g, '.') + '@example.com'}
              />
            )}
        </div>
      </SignedIn>
    </>
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



