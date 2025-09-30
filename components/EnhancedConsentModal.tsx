import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export type ProcessingMethod = 'company_llm' | 'external_ai' | 'local_patterns' | 'manual_only';

export interface EnhancedConsentData {
  processingMethod: ProcessingMethod;
  dataRetention: number; // days
  sensitiveDataDetected: boolean;
  sanitizationRequired: boolean;
  explicitConsent: boolean;
}

export interface EnhancedConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consent: EnhancedConsentData) => void;
  fileName: string;
  sensitiveDataDetected?: boolean;
  detectedPatterns?: Array<{ type: string; count: number; description: string }>;
  companyLLMAvailable?: boolean;
}

export const EnhancedConsentModal: React.FC<EnhancedConsentModalProps> = ({
  isOpen,
  onClose,
  onConsent,
  fileName,
  sensitiveDataDetected = false,
  detectedPatterns = [],
  companyLLMAvailable = true
}) => {
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>(
    companyLLMAvailable ? 'company_llm' : 'local_patterns'
  );
  const [dataRetention, setDataRetention] = useState(30);
  const [sanitizationRequired, setSanitizationRequired] = useState(sensitiveDataDetected);
  const [explicitConsent, setExplicitConsent] = useState(false);

  if (!isOpen) return null;

  const handleConsent = () => {
    onConsent({
      processingMethod,
      dataRetention,
      sensitiveDataDetected,
      sanitizationRequired,
      explicitConsent
    });
    onClose();
  };

  const handleReject = () => {
    onClose();
  };

  const getProcessingDescription = (method: ProcessingMethod) => {
    switch (method) {
      case 'company_llm':
        return {
          title: 'Company Internal AI',
          description: 'Process using your company\'s internal LLM. Data stays within your organization.',
          privacy: 'Highest Privacy',
          quality: 'Excellent Analysis',
          icon: '🏢',
          color: 'bg-green-100 border-green-300 text-green-800'
        };
      case 'external_ai':
        return {
          title: 'External AI (Google Gemini)',
          description: 'Process using Google\'s Gemini API. Provides advanced analysis but data leaves your infrastructure.',
          privacy: 'Lower Privacy',
          quality: 'Excellent Analysis',
          icon: '☁️',
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
        };
      case 'local_patterns':
        return {
          title: 'Local Pattern Matching',
          description: 'Process using local rules and patterns. Basic analysis with complete privacy.',
          privacy: 'Highest Privacy',
          quality: 'Basic Analysis',
          icon: '🔧',
          color: 'bg-blue-100 border-blue-300 text-blue-800'
        };
      case 'manual_only':
        return {
          title: 'Manual Review Only',
          description: 'No automated processing. Complete manual review required.',
          privacy: 'Highest Privacy',
          quality: 'Manual Required',
          icon: '👤',
          color: 'bg-gray-100 border-gray-300 text-gray-800'
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Document Processing Method
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

            {/* Processing Method Selection */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Choose Processing Method</h3>
              <div className="space-y-3">
                {/* Company LLM Option */}
                {companyLLMAvailable && (
                  <label className="block">
                    <input
                      type="radio"
                      name="processing"
                      value="company_llm"
                      checked={processingMethod === 'company_llm'}
                      onChange={(e) => setProcessingMethod(e.target.value as ProcessingMethod)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      processingMethod === 'company_llm'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">🏢</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">Company Internal AI</h4>
                            <div className="flex space-x-2">
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Highest Privacy
                              </span>
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                Excellent Analysis
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Process using your company's internal LLM. Data stays within your organization's infrastructure.
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                )}

                {/* External AI Option */}
                <label className="block">
                  <input
                    type="radio"
                    name="processing"
                    value="external_ai"
                    checked={processingMethod === 'external_ai'}
                    onChange={(e) => setProcessingMethod(e.target.value as ProcessingMethod)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    processingMethod === 'external_ai'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">☁️</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">External AI (Google Gemini)</h4>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                              Lower Privacy
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Excellent Analysis
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Process using Google's Gemini API. Advanced analysis but data leaves your infrastructure.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Local Patterns Option */}
                <label className="block">
                  <input
                    type="radio"
                    name="processing"
                    value="local_patterns"
                    checked={processingMethod === 'local_patterns'}
                    onChange={(e) => setProcessingMethod(e.target.value as ProcessingMethod)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    processingMethod === 'local_patterns'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">🔧</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Local Pattern Matching</h4>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Highest Privacy
                            </span>
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                              Basic Analysis
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Process using local rules and patterns. Basic analysis with complete privacy.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Manual Only Option */}
                <label className="block">
                  <input
                    type="radio"
                    name="processing"
                    value="manual_only"
                    checked={processingMethod === 'manual_only'}
                    onChange={(e) => setProcessingMethod(e.target.value as ProcessingMethod)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    processingMethod === 'manual_only'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">👤</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Manual Review Only</h4>
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Highest Privacy
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                              Manual Required
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          No automated processing. Upload document for manual review only.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </Card>

            {/* Data Sanitization */}
            {sensitiveDataDetected && processingMethod !== 'manual_only' && (
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
                      {processingMethod === 'external_ai'
                        ? 'Highly recommended: Replace detected sensitive information with placeholders before sending to external service.'
                        : 'Recommended: Replace detected sensitive information with placeholders before processing.'
                      }
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

            {/* Explicit Consent */}
            <Card className="p-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={explicitConsent}
                  onChange={(e) => setExplicitConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    I understand and consent to the selected processing method
                  </span>
                  <p className="text-gray-600 mt-1">
                    I acknowledge the privacy implications of my chosen processing method and consent to
                    processing my document according to the selected options above.
                  </p>
                </div>
              </label>
            </Card>

            {/* Privacy Notice */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy Summary</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Documents are encrypted during storage</li>
                <li>• Access is logged and monitored for security</li>
                <li>• You can request deletion at any time</li>
                {processingMethod === 'company_llm' && (
                  <li>• Processing uses your company's internal AI - data stays in-house</li>
                )}
                {processingMethod === 'external_ai' && (
                  <li>• External processing is subject to third-party privacy policies</li>
                )}
                {processingMethod === 'local_patterns' && (
                  <li>• All processing happens locally - no external data sharing</li>
                )}
              </ul>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button
              onClick={handleReject}
              variant="secondary"
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsent}
              disabled={!explicitConsent}
              className={`px-6 py-2 ${
                explicitConsent
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Accept & Process
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedConsentModal;