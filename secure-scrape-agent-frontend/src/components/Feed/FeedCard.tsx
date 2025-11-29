import { Link } from 'react-router-dom';
import { Job } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
  job: Job;
  isNew?: boolean;
}

export default function FeedCard({ job, isNew }: FeedCardProps) {
  return (
    <div className="card p-6 hover:shadow-md transition-shadow relative animate-fade-in">
      {isNew && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
          NEW
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <Link
            to={`/job/${job.id}`}
            className="text-lg font-semibold hover:text-primary-600 transition-colors"
          >
            {job.title}
          </Link>
          {job.company && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {job.company}
            </p>
          )}
        </div>
        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          {job.source}
        </span>
      </div>

      {job.summary && (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
          {job.summary}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex space-x-3">
          {job.publishedAt && (
            <span>
              📅 {formatDistanceToNow(new Date(job.publishedAt))} ago
            </span>
          )}
          {job.tags.length > 0 && (
            <div className="flex space-x-1">
              {job.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button className="text-primary-600 hover:text-primary-700">
            View
          </button>
          <button className="text-gray-600 hover:text-gray-700">
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
