import React, { useState, useEffect } from 'react';
import { UrlInput } from '../../components/Playground/UrlInput';
import { LiveStatus } from '../../components/Playground/LiveStatus';
import { HtmlPreview } from '../../components/Playground/HtmlPreview';
import { ExtractedFields } from '../../components/Playground/ExtractedFields';
import { BatchTable } from '../../components/Playground/BatchTable';
import { socketService } from '../../services/websocket';

interface Log {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface BatchResult {
  url: string;
  status: 'pending' | 'scraping' | 'success' | 'error';
  title?: string;
  error?: string;
}

export const PlaygroundPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [currentData, setCurrentData] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [stats, setStats] = useState({ scraped: 0, failed: 0, total: 0 });

  useEffect(() => {
    const addLog = (message: string, type: Log['type'] = 'info') => {
      setLogs((prev) => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message, type },
      ]);
    };

    // Connect and setup listeners
    socketService.connect().then(() => {
      socketService.on('scrape:status', (data: any) => {
        setStatus(data.status);
        addLog(`${data.url}: ${data.message}`, 'info');

        // Update batch status
        setBatchResults((prev) =>
          prev.map((r) => (r.url === data.url ? { ...r, status: 'scraping' } : r))
        );
      });

      socketService.on('scrape:complete', (data: any) => {
        addLog(`Successfully scraped ${data.url}`, 'success');
        setCurrentData(data.data);

        // Update stats and progress using the updated values
        setStats((prev) => {
          const updated = { ...prev, scraped: prev.scraped + 1 };
          const denom = updated.total || 1;
          const newProgress = ((updated.scraped + updated.failed) / denom) * 100;
          setProgress(newProgress);
          return updated;
        });

        // Update batch status
        setBatchResults((prev) =>
          prev.map((r) =>
            r.url === data.url ? { ...r, status: 'success', title: data.data.title } : r
          )
        );
      });

      socketService.on('scrape:error', (data: any) => {
        addLog(`Error scraping ${data.url}: ${data.error}`, 'error');

        setStats((prev) => {
          const updated = { ...prev, failed: prev.failed + 1 };
          const denom = updated.total || 1;
          const newProgress = ((updated.scraped + updated.failed) / denom) * 100;
          setProgress(newProgress);
          return updated;
        });

        // Update batch status
        setBatchResults((prev) =>
          prev.map((r) =>
            r.url === data.url ? { ...r, status: 'error', error: data.error } : r
          )
        );
      });

      socketService.on('scrape:batch:complete', () => {
        setIsLoading(false);
        setStatus('completed');
        addLog('Batch processing completed', 'success');
      });
    });

    return () => {
      socketService.off('scrape:status');
      socketService.off('scrape:complete');
      socketService.off('scrape:error');
      socketService.off('scrape:batch:complete');
    };
  }, []);

  const handleScrape = (urls: string[]) => {
    setIsLoading(true);
    setLogs([]);
    setProgress(0);
    setStats({ scraped: 0, failed: 0, total: urls.length });
    setBatchResults(urls.map((url) => ({ url, status: 'pending' })));
    setCurrentData(null);

    if (urls.length === 1) {
      socketService.emit('scrape:start', { url: urls[0] });
    } else {
      socketService.emit('scrape:batch', { urls });
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] p-6 bg-gray-50 flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Scraper Playground</h1>
        <div className="text-sm text-gray-500">Test and validate scraping on any URL</div>
      </div>

      {/* main grid: allow children to scroll by using min-h-0 on flex container */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Panel: Input */}
        <div className="col-span-3 flex flex-col gap-6 min-h-0 h-full">
          {/* Keep UrlInput at top, limit its height if needed */}
          <div className="flex-shrink-0">
            <UrlInput onScrape={handleScrape} isLoading={isLoading} />
          </div>

          {/* LiveStatus should scroll if logs are long */}
          <div className="min-h-0 overflow-auto bg-white rounded-md p-4 shadow-sm">
            <LiveStatus status={status} progress={progress} logs={logs} stats={stats} />
          </div>
        </div>

        {/* Center Panel: Preview */}
        <div className="col-span-5 min-h-0 h-full flex flex-col overflow-hidden">
          <div className="bg-white rounded-md shadow-sm h-full min-h-0 overflow-auto">
            <HtmlPreview
              html={currentData?.content_html || currentData?.raw_html}
              url={currentData?.url}
            />
          </div>
        </div>

        {/* Right Panel: Data */}
        <div className="col-span-4 min-h-0 h-full flex flex-col overflow-hidden">
          <div className="bg-white rounded-md shadow-sm h-full min-h-0 overflow-auto p-4">
            <ExtractedFields data={currentData} />
          </div>
        </div>
      </div>

      {/* Batch Results (Conditional) */}
      {batchResults.length > 1 && (
        <div className="flex-shrink-0 max-h-48 w-full overflow-auto bg-white rounded-md shadow-sm p-2">
          <BatchTable results={batchResults} />
        </div>
      )}
    </div>
  );
};

export default PlaygroundPage;
