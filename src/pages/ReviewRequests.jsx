import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import PageHeader from '../components/shared/PageHeader';
import { Eye, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ReviewRequests() {
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviewRequests'],
    queryFn: () => base44.entities.ReviewRequest.list('-updated_date', 50),
  });

  const { data: clients = {} } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const clientList = await base44.entities.Client.list();
      return Object.fromEntries(clientList.map(c => [c.id, c]));
    },
  });

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    commented: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const copyShareLink = (token) => {
    const link = `${window.location.origin}/#/PublicReviewView?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Link copied to clipboard');
  };

  if (isLoading) return <div className="p-6 text-center">Loading reviews...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Review Requests"
        description="Manage work sent for client review"
      />

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No review requests yet</p>
          </div>
        ) : (
          reviews.map((review) => {
            const client = clients[review.client_id];
            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{review.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      To: <span className="font-medium">{client?.first_name} {client?.last_name}</span>
                    </p>
                    {review.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{review.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span
                        className={cn(
                          'text-xs font-medium px-2.5 py-1 rounded-full border',
                          statusColors[review.status]
                        )}
                      >
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500">
                        v{review.version} • {review.file_urls?.length} file{review.file_urls?.length !== 1 ? 's' : ''}
                      </span>
                      {review.due_date && (
                        <span className="text-xs text-slate-500">
                          Due: {format(new Date(review.due_date), 'MMM d')}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {format(new Date(review.created_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyShareLink(review.share_token)}
                      title="Copy shareable link"
                    >
                      {copiedToken === review.share_token ? (
                        <span className="text-xs">Copied!</span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={`#/PublicReviewView?token=${review.share_token}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {review.comments?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      {review.comments.length} comment{review.comments.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      {review.comments.slice(-2).map((comment, idx) => (
                        <div key={idx} className="bg-slate-50 rounded p-2 text-xs">
                          <p className="font-medium text-slate-700">{comment.author}</p>
                          <p className="text-slate-600 mt-1 line-clamp-1">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}