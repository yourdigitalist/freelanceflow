import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Download, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PublicReviewView() {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const { data: review, isLoading, isError } = useQuery({
    queryKey: ['publicReview', token],
    queryFn: async () => {
      const reviews = await base44.entities.ReviewRequest.filter({ share_token: token });
      return reviews[0] || null;
    },
    enabled: !!token,
  });

  const { data: project } = useQuery({
    queryKey: ['project', review?.project_id],
    queryFn: () => base44.entities.Project.filter({ id: review.project_id }).then(p => p[0]),
    enabled: !!review,
  });

  const { data: client } = useQuery({
    queryKey: ['client', review?.client_id],
    queryFn: () => base44.entities.Client.filter({ id: review.client_id }).then(c => c[0]),
    enabled: !!review,
  });

  const updateReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.ReviewRequest.update(review.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicReview'] });
    },
  });

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    if (!clientName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      const newComment = {
        id: Math.random().toString(36).substring(7),
        author: clientName,
        author_email: 'client',
        text: comment,
        created_at: new Date().toISOString(),
      };

      const updatedComments = [...(review.comments || []), newComment];
      const newStatus = review.status === 'pending' ? 'commented' : review.status;

      await updateReviewMutation.mutateAsync({
        comments: updatedComments,
        status: newStatus,
      });

      setComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateReviewMutation.mutateAsync({ status: newStatus });
      toast.success(`Review marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update review status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Review request not found or link expired</p>
          <p className="text-sm text-slate-500">Please check the URL and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{review.title}</h1>
              <p className="text-slate-600 mt-1">Project: {project?.name}</p>
            </div>
            <span className={cn(
              'text-sm font-medium px-3 py-1 rounded-full',
              review.status === 'approved' && 'bg-green-100 text-green-700',
              review.status === 'rejected' && 'bg-red-100 text-red-700',
              review.status === 'commented' && 'bg-blue-100 text-blue-700',
              review.status === 'pending' && 'bg-yellow-100 text-yellow-700'
            )}>
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </span>
          </div>

          {review.description && (
            <p className="text-slate-600 mb-4">{review.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Version {review.version}</span>
            <span>•</span>
            <span>Submitted {format(new Date(review.created_date), 'MMM d, yyyy')}</span>
            {review.due_date && (
              <>
                <span>•</span>
                <span>Due {format(new Date(review.due_date), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Files for Review</h2>
          <div className="space-y-2">
            {review.file_urls?.map((file, idx) => (
              <a
                key={idx}
                href={file.url}
                download={file.filename}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors group"
              >
                <span className="text-slate-700 font-medium group-hover:text-slate-900">{file.filename}</span>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </a>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Comments</h2>

          {review.comments?.length > 0 ? (
            <div className="space-y-4 mb-6">
              {review.comments.map((comment, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">{comment.author}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <p className="text-slate-700">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mb-6">No comments yet</p>
          )}

          {/* Add comment form */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Add a Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback..."
                rows={4}
              />
            </div>
            <Button
              onClick={handleAddComment}
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 mr-2" />
              )}
              {submitting ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>

        {/* Status actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Review Status</h2>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => handleStatusChange('approved')}
              disabled={review.status === 'approved'}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => handleStatusChange('rejected')}
              disabled={review.status === 'rejected'}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}