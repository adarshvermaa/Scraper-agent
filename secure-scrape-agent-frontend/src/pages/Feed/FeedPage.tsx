import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FixedSizeList as List } from 'react-window';
import apiClient from '@/services/api';
import { Job } from '@/types/api';
import FeedCard from '@/components/Feed/FeedCard';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', searchQuery, filters, page],
    queryFn: () => apiClient.searchJobs(searchQuery || 'all', filters, page, 50),
  });

  useEffect(() => {
    // Listen for new items via WebSocket
    const unsubscribe = apiClient.onNewJob((job: Job) => {
      setNewItemIds((prev) => new Set(prev).add(job.id));
      toast.success('New job posted!');
      refetch();
    });

    return unsubscribe;
  }, [refetch]);

  const jobs = data?.jobs || [];

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const job = jobs[index];
    const isNew = newItemIds.has(job.id);

    return (
      <div style={style}>
        <FeedCard job={job} isNew={isNew} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Job Feed</h1>
        <div className="text-sm text-gray-500">
          {data?.total || 0} jobs indexed
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search jobs..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && refetch()}
        />
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          No jobs found. Try adjusting your search.
        </div>
      ) : (
        <List
          height={800}
          itemCount={jobs.length}
          itemSize={200}
          width="100%"
        >
          {Row}
        </List>
      )}

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {page}
        </span>
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data || jobs.length < 50}
        >
          Next
        </button>
      </div>
    </div>
  );
}
