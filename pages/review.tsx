import React, { useState, FormEvent } from 'react';
import IssuesTable from '@/components/IssuesTable';
import EmailPreview from '@/components/EmailPreview';
import type { EmailGenerationResult, Customer, Fund, Issue as EmailIssue } from '../lib/email';

interface Issue {
  page: number;
  type: string;
  message: string;
  original: string;
  suggestion: string;
}

interface AnalysisResult {
  issues: Issue[];
  summary: string;
}

// --- Mock Data: Replace with your actual data from props or state ---
const mockCustomer: Customer = { name: "Acme GP", timezone: "America/New_York", isExistingCustomer: true };
const mockFunds: Fund[] = [{fullName:"Acme Growth Fund II, L.P.", shortName:"the Fund"}];
// ---------------------------------------------------------------------

export default function ReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailResult, setEmailResult] = useState<EmailGenerationResult | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);

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
    setEmailResult(null);

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

  const handleGenerateEmail = async (customer: Customer, funds: Fund[]) => {
    console.log('handleGenerateEmail called');
    if (!result) {
        console.log('No result found, returning');
        return;
    }

    setIsGeneratingEmail(true);
    setError(null);

    try {
        console.log('Calling /api/generate-email');
        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer,
                funds,
                issues: result.issues,
                typos: [], // TODO: Add logic to get typos if available
                expectedDate: new Date().toISOString().split('T')[0], // TODO: Implement correct date logic
            }),
        });
        console.log('API response received', response);

        const emailData = await response.json();

        if (!response.ok) {
            throw new Error(emailData.error || 'Something went wrong');
        }

        setEmailResult(emailData);
        console.log('emailResult state updated');
    } catch (err: any) {
        console.error('Error generating email:', err);
        setError(err.message ?? 'Unexpected error');
    } finally {
        setIsGeneratingEmail(false);
        console.log('handleGenerateEmail finished');
    }
  }

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

      setEmailResult(null); // Close the modal
    } catch (error: any) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    }
  };

  const handleCloseEmailPreview = () => {
    setEmailResult(null);
  };

  // Convert analysis issues to email issues format
  const convertToEmailIssues = (analysisIssues: Issue[]): EmailIssue[] => {
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

        {result?.issues && (
            <>
                <IssuesTable issues={result.issues} />
                <div className="mt-8 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Ready to Generate Email
                                </h3>
                                <p className="text-sm text-gray-600 mb-0">
                                    {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found. Generate a professional email to send to the customer.
                                </p>
                            </div>
                            <div className="ml-6">
                                <button
                                    onClick={() => handleGenerateEmail(mockCustomer, mockFunds)}
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
        )}

        {emailResult && (
            <EmailPreview
                result={emailResult}
                issues={result?.issues ? convertToEmailIssues(result.issues) : []}
                typos={[]} // TODO: Add typos from analysis result when available
                onSend={handleSendEmail}
                onRegenerate={() => handleGenerateEmail(mockCustomer, mockFunds)}
                onClose={handleCloseEmailPreview}
                defaultRecipientEmail={mockCustomer.name.toLowerCase().replace(/\s+/g, '.') + '@example.com'}
            />
        )}
    </>
  );
}

