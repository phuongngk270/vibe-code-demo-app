import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export interface ConsentData {
  externalProcessing: boolean;
  dataRetention: number; // days
  sensitiveDataDetected: boolean;
  sanitizationRequired: boolean;
}

export interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consent: ConsentData) => void;
  fileName: string;
  sensitiveDataDetected?: boolean;
  detectedPatterns?: Array<{ type: string; count: number; description: string }>;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onConsent,
  fileName,
  sensitiveDataDetected = false,
  detectedPatterns = []
}) => {
  const [externalProcessing, setExternalProcessing] = useState(false);
  const [dataRetention, setDataRetention] = useState(30);
  const [sanitizationRequired, setSanitizationRequired] = useState(sensitiveDataDetected);

  if (!isOpen) return null;

  const handleConsent = () => {
    onConsent({
      externalProcessing,
      dataRetention,
      sensitiveDataDetected,
      sanitizationRequired
    });
    onClose();
  };

  const handleReject = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Document Processing Consent
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* File Information */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Document Information</h3>
              <p className="text-sm text-gray-600">
                <strong>File:</strong> {fileName}
              </p>
              {sensitiveDataDetected && (
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Sensitive data detected in this document
                  </p>
                  {detectedPatterns.length > 0 && (
                    <ul className="mt-2 text-sm text-yellow-700">
                      {detectedPatterns.map((pattern, index) => (
                        <li key={index}>
                          • {pattern.description}: {pattern.count} instance{pattern.count !== 1 ? 's' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>

            {/* External Processing Consent */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">External AI Processing</h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={externalProcessing}
                    onChange={(e) => setExternalProcessing(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      I consent to external processing via Google Gemini API
                    </span>
                    <p className="text-gray-600 mt-1">
                      Your document will be sent to Google's Gemini API for analysis. This enables advanced
                      document processing capabilities but means your data will leave our secure environment.
                    </p>
                  </div>
                </label>

                {!externalProcessing && (
                  <div className="p-3 bg-blue-100 border border-blue-300 rounded-md">
                    <p className="text-sm text-blue-800">
                      💡 Without external processing, document analysis will use local processing only,
                      which may have limited capabilities.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Data Sanitization */}
            {sensitiveDataDetected && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Data Sanitization</h3>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={sanitizationRequired}
                    onChange={(e) => setSanitizationRequired(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Remove sensitive data before processing
                    </span>
                    <p className="text-gray-600 mt-1">
                      Recommended: Replace detected sensitive information (SSNs, credit cards, etc.)
                      with placeholders before analysis.
                    </p>
                  </div>
                </label>
              </Card>
            )}

            {/* Data Retention */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Data Retention</h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Delete document and analysis results after:
                </label>
                <select
                  value={dataRetention}
                  onChange={(e) => setDataRetention(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                </select>
                <p className="text-sm text-gray-600">
                  Your document and all associated data will be automatically deleted after this period.
                </p>
              </div>
            </Card>

            {/* Privacy Notice */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy Notice</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Documents are encrypted during storage and processing</li>
                <li>• Access is logged and monitored for security</li>
                <li>• You can request deletion at any time</li>
                <li>• External processing is subject to third-party privacy policies</li>
              </ul>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button
              onClick={handleReject}
              variant="outline"
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsent}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept & Process
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;