import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { EmailGenerationResult } from '../lib/email';

interface Props {
  result: EmailGenerationResult;
  onSend: () => void;
  onRegenerate: () => void;
}

const EmailPreview: React.FC<Props> = ({ result, onSend, onRegenerate }) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(10);

  const handleScheduleSend = () => {
    setIsScheduling(true);
    // Placeholder for actual scheduling logic
    setTimeout(() => {
      onSend();
      setIsScheduling(false);
    }, scheduleTime * 60 * 1000);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-full overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Email Preview</h2>
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
            <h3 className="font-semibold text-lg mb-2">Opening</h3>
            <p className="text-gray-700">{result.email.bodyHtml.split('</p>')[0].replace('<p>', '')}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Questions</h3>
            <ul className="list-disc list-inside space-y-4">
              {result.flags.map((flag, index) => (
                <li key={`flag-${index}`} className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                    <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
                        <p className="text-yellow-800 text-sm">{flag.message}</p>
                    </div>
                </li>
              ))}
              {/* This is a simplified rendering. The actual questions should be parsed from the bodyHtml */}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Closing</h3>
            <p className="text-gray-700">{result.email.bodyHtml.split('<p>').pop()?.replace('</p>', '')}</p>
          </div>
        </div>

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
              <button onClick={handleScheduleSend} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Schedule Send (10 min)
              </button>
              <button onClick={onSend} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                Send Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
