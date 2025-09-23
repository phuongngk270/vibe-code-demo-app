import React, { useState, FormEvent } from 'react';
import IssuesTable from '@/components/IssuesTable';
import EmailPreview from '@/components/EmailPreview';
import type { EmailGenerationResult, Customer, Fund } from '../lib/email';

// ... (type definitions for Issue and AnalysisResult remain the same)

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

  const handleSendEmail = () => {
    // TODO: Implement email sending logic with your email service
    console.log('Sending email...', emailResult);
    alert('Email sent! (placeholder)');
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
                <div className="mt-6 text-right">
                    <button onClick={() => handleGenerateEmail(mockCustomer, mockFunds)} className="btn btn-secondary" disabled={isGeneratingEmail}>
                        {isGeneratingEmail ? 'Generating Email...' : 'Generate Email'}
                    </button>
                </div>
            </>
        )}

        {emailResult && (
            <EmailPreview 
                result={emailResult} 
                onSend={handleSendEmail} 
                onRegenerate={() => handleGenerateEmail(mockCustomer, mockFunds)} 
            />
        )}
    </>
  );
}

