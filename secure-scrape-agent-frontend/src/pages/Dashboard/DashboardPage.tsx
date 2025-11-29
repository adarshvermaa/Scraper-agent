import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.getMetrics(),
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Queue Lengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2">Scraping Queue</h2>
          <div className="text-4xl font-bold text-primary-600">
            {metrics?.queueLengths.scraping || 0}
          </div>
          <p className="text-sm text-gray-500 mt-2">Pending scrape jobs</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2">Ingestion Queue</h2>
          <div className="text-4xl font-bold text-green-600">
            {metrics?.queueLengths.ingestion || 0}
          </div>
          <p className="text-sm text-gray-500 mt-2">Pending ingestion jobs</p>
        </div>
      </div>

      {/* Vector Count */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">Vector Store</h2>
        <div className="text-4xl font-bold text-purple-600">
          {metrics?.vectorCount.toLocaleString() || 0}
        </div>
        <p className="text-sm text-gray-500 mt-2">Total embeddings indexed</p>
      </div>

      {/* Provider Costs */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Provider Costs (Estimate)</h2>
        <div className="space-y-4">
          {metrics?.providerCosts.map((cost) => (
            <div key={cost.provider} className="flex items-center justify-between">
              <div>
                <div className="font-medium capitalize">{cost.provider}</div>
                <div className="text-sm text-gray-500">
                  {cost.totalTokens.toLocaleString()} tokens
                </div>
              </div>
              <div className="text-lg font-semibold">
                ${cost.estimatedCost.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
