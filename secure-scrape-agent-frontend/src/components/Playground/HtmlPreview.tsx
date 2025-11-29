import React, { useState } from 'react';

interface HtmlPreviewProps {
  html: string | null;
  url: string | null;
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({ html, url }) => {
  const [viewRaw, setViewRaw] = useState(false);

  if (!html) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p>No content loaded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2 overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 whitespace-nowrap">Preview</h2>
          {url && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]" title={url}>
              - {url}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">View Raw HTML</span>
          <button
            onClick={() => setViewRaw(!viewRaw)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              viewRaw ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                viewRaw ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {viewRaw ? (
          <textarea
            readOnly
            value={html}
            className="w-full h-full p-4 font-mono text-xs text-gray-600 resize-none focus:outline-none"
          />
        ) : (
          <iframe
            srcDoc={html}
            title="Preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};
