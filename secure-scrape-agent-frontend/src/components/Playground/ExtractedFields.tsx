import React from 'react';
import ReactJson from 'react-json-view';

interface ExtractedFieldsProps {
  data: any | null;
}

export const ExtractedFields: React.FC<ExtractedFieldsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        <p>No data extracted</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Extracted Data</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <ReactJson 
          src={data} 
          theme="rjv-default" 
          displayDataTypes={false} 
          enableClipboard={true}
          collapsed={1}
          style={{ fontSize: '12px', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );
};
