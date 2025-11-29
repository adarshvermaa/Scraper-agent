import React, { useState } from 'react';

interface UrlInputProps {
  onScrape: (urls: string[]) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onScrape, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = input
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    
    if (urls.length > 0) {
      onScrape(urls);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">URLs to Scrape</h2>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <textarea
          className="flex-1 w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder="https://example.com/job1&#10;https://example.com/job2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isLoading ? 'Processing...' : 'Start Scrape'}
          </button>
          <button
            type="button"
            onClick={() => setInput('')}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};
