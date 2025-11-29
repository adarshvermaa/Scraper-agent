import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Log {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface LiveStatusProps {
  status: string;
  progress: number;
  logs: Log[];
  stats: {
    scraped: number;
    failed: number;
    total: number;
  };
}

export const LiveStatus: React.FC<LiveStatusProps> = ({ status, progress, logs, stats }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${progress}%`,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  }, [progress]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Live Status</h2>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="capitalize">{status}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            style={{ width: '0%' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-md border border-green-100">
          <div className="text-sm text-green-600 font-medium">Scraped</div>
          <div className="text-2xl font-bold text-green-700">{stats.scraped}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-md border border-red-100">
          <div className="text-sm text-red-600 font-medium">Failed</div>
          <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 bg-gray-900 rounded-md p-4 overflow-hidden flex flex-col">
        <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Real-time Logs</div>
        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar">
          {logs.length === 0 && (
            <div className="text-gray-600 italic">Waiting for logs...</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
              <span className={
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-blue-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
