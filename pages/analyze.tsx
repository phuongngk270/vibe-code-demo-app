import { useState, FormEvent } from 'react';

type AnalysisResult = {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
};

export default function AnalyzePage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Text Analysis</h1>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full h-40 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400"
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Analysis Result</h2>
            <p><strong>Sentiment:</strong> {result.sentiment}</p>
            <p><strong>Confidence:</strong> {result.confidence.toFixed(2)}</p>
            <p><strong>Keywords:</strong> {result.keywords.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
