import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => apiClient.getJob(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!job) {
    return <div className="card p-12 text-center">Job not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        {job.company && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {job.company}
          </p>
        )}

        <div className="flex space-x-4 text-sm text-gray-500 mb-6">
          <span>Source: {job.source}</span>
          <span>Status: {job.status}</span>
          {job.publishedAt && (
            <span>Published: {new Date(job.publishedAt).toLocaleDateString()}</span>
          )}
        </div>

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline"
        >
          View Original →
        </a>
      </div>

      {/* Content */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Content</h2>
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap">{job.content}</pre>
        </div>
      </div>

      {/* Summary */}
      {job.summary && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <p className="text-gray-700 dark:text-gray-300">{job.summary}</p>
        </div>
      )}

      {/* Contact Info */}
      {job.contactInfo && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          {job.contactInfo.emails.length > 0 && (
            <div className="mb-3">
              <h3 className="font-medium mb-2">Emails:</h3>
              <ul className="space-y-1">
                {job.contactInfo.emails.map((email) => (
                  <li key={email}>
                    <a
                      href={`mailto:${email}`}
                      className="text-primary-600 hover:underline"
                    >
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {job.contactInfo.phones.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Phones:</h3>
              <ul className="space-y-1">
                {job.contactInfo.phones.map((phone) => (
                  <li key={phone}>{phone}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
