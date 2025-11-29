import React from 'react';

interface BatchResult {
  url: string;
  status: 'pending' | 'scraping' | 'success' | 'error';
  title?: string;
  error?: string;
}

interface BatchTableProps {
  results: BatchResult[];
}

export const BatchTable: React.FC<BatchTableProps> = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Batch Results</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Error</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${result.status === 'success' ? 'bg-green-100 text-green-800' : 
                      result.status === 'error' ? 'bg-red-100 text-red-800' : 
                      result.status === 'scraping' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {result.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={result.url}>
                  {result.url}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-md">
                  {result.error ? (
                    <span className="text-red-500" title={result.error}>{result.error}</span>
                  ) : (
                    <span title={result.title}>{result.title || '-'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
