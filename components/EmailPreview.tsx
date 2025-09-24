import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X, Mail, Edit } from 'lucide-react';
import type { EmailGenerationResult, Issue, Typo } from '../lib/email';

interface Props {
  result: EmailGenerationResult;
  issues?: Issue[];
  typos?: Typo[];
  onSend: (recipientEmail: string) => void;
  onRegenerate: () => void;
  onClose: () => void;
  defaultRecipientEmail?: string;
}

const EmailPreview: React.FC<Props> = ({
  result,
  issues = [],
  typos = [],
  onSend,
  onRegenerate,
  onClose,
  defaultRecipientEmail = ''
}) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(10);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [emailError, setEmailError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState({
    subject: result.email.subject,
    bodyText: result.email.bodyText
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setRecipientEmail(email);
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSendNow = () => {
    if (!recipientEmail) {
      setEmailError('Recipient email is required');
      return;
    }
    if (!validateEmail(recipientEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    onSend(recipientEmail);
  };

  const handleScheduleSend = () => {
    if (!recipientEmail) {
      setEmailError('Recipient email is required');
      return;
    }
    if (!validateEmail(recipientEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setIsScheduling(true);
    // Placeholder for actual scheduling logic
    setTimeout(() => {
      onSend(recipientEmail);
      setIsScheduling(false);
    }, scheduleTime * 60 * 1000);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Update the email content with edited version
    result.email.subject = editableContent.subject;
    result.email.bodyText = editableContent.bodyText;
    result.email.bodyHtml = editableContent.bodyText.replace(/\n/g, '<br>');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    // Reset to original content
    setEditableContent({
      subject: result.email.subject,
      bodyText: result.email.bodyText
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-full overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Email' : 'Email Preview'}
            </h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Edit email"
                >
                  <Edit className="h-5 w-5 text-blue-600" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close modal"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              {result.metadata.toneCheckPassed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="ml-2 text-sm">Tone Check</span>
            </div>
            <div className="flex items-center">
              {result.metadata.referencesCheckPassed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="ml-2 text-sm">References Check</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="recipient-email"
                value={recipientEmail}
                onChange={handleEmailChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="customer@example.com"
                aria-describedby={emailError ? 'email-error' : undefined}
              />
            </div>
            {emailError && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {emailError}
              </p>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  id="email-subject"
                  value={editableContent.subject}
                  onChange={(e) => setEditableContent({...editableContent, subject: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  id="email-body"
                  rows={15}
                  value={editableContent.bodyText}
                  onChange={(e) => setEditableContent({...editableContent, bodyText: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-2">Subject</h3>
                <p className="text-gray-700 font-medium">{result.email.subject}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Opening</h3>
                <p className="text-gray-700">{result.email.bodyHtml.split('</p>')[0].replace('<p>', '')}</p>
              </div>
            </>
          )}

          {!isEditing && (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-2">Questions</h3>
                <div className="space-y-4">
              {/* Render Issues */}
              {issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-base mb-3 text-gray-800">Issues Found:</h4>
                  <ul className="space-y-3">
                    {issues.map((issue, index) => (
                      <li key={`issue-${index}`} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-blue-900 font-medium">
                              <strong>{issue.category}</strong> → {issue.sectionTitle} ({issue.pageRef})
                            </p>
                            <p className="text-blue-800 text-sm mt-1">
                              <strong>Proposed solution:</strong> Please review and clarify the intended approach for this section.
                            </p>
                            {issue.needsUpdatedPDF && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-2">
                                Updated PDF required
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Render Typos */}
              {typos.length > 0 && (
                <div>
                  <h4 className="font-medium text-base mb-3 text-gray-800">Typos Found:</h4>
                  <ul className="space-y-2">
                    {typos.map((typo, index) => (
                      <li key={`typo-${index}`} className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                          <p className="text-yellow-900 text-sm">
                            <strong>{typo.pageRef}:</strong> "{typo.excerpt}" → "{typo.suggestedFix}"
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show flags if no issues/typos but flags exist */}
              {issues.length === 0 && typos.length === 0 && result.flags.length > 0 && (
                <div>
                  <h4 className="font-medium text-base mb-3 text-gray-800">Processing Flags:</h4>
                  <ul className="space-y-2">
                    {result.flags.map((flag, index) => (
                      <li key={`flag-${index}`} className="bg-gray-50 border-l-4 border-gray-500 p-3 rounded-r-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-800 text-sm">{flag.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Empty state */}
              {issues.length === 0 && typos.length === 0 && result.flags.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No issues or typos found. The document looks good!</p>
                </div>
                )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Closing</h3>
                <p className="text-gray-700">{result.email.bodyHtml.split('<p>').pop()?.replace('</p>', '')}</p>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-4">
            <button onClick={onRegenerate} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
              Regenerate
            </button>
            {isScheduling ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Sending in {scheduleTime} minutes...</span>
              </div>
            ) : (
              <>
                <button
                  onClick={handleScheduleSend}
                  disabled={!recipientEmail || !!emailError}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Schedule Send (10 min)
                </button>
                <button
                  onClick={handleSendNow}
                  disabled={!recipientEmail || !!emailError}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send Now
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreview;
