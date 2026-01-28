import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download, FileText, Send, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PublicReviewView() {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');

  useEffect(() => {
    const loadReview = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        let token = searchParams.get('token');
        
        if (!token) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
          token = hashParams.get('token');
        }

        if (!token) {
          setError('Invalid review link');
          setLoading(false);
          return;
        }

        const response = await base44.functions.invoke('getReviewByShareToken', { token });
        setReviewData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Review not found');
        setLoading(false);
      }
    };

    loadReview();
  }, []);

  const review = reviewData?.review;
  const client = reviewData?.client;
  const project = reviewData?.project;

  const reloadReview = async () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let token = searchParams.get('token');
      
      if (!token) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
        token = hashParams.get('token');
      }

      if (token) {
        const response = await base44.functions.invoke('getReviewByShareToken', { token });
        setReviewData(response.data);
      }
    } catch (err) {
      console.error('Failed to reload review:', err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !visitorName.trim() || !visitorEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const newComment = {
        id: Date.now().toString(),
        author: visitorName,
        author_email: visitorEmail,
        text: comment,
        created_at: new Date().toISOString(),
      };

      const updatedComments = [...(review.comments || []), newComment];

      await base44.functions.invoke('updateReviewComment', {
        reviewId: review.id,
        comments: updatedComments,
      });

      setComment('');
      toast.success('Comment added');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      await base44.functions.invoke('updateReviewStatus', {
        reviewId: review.id,
        status: 'approved',
      });
      toast.success('Document approved');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async () => {
    try {
      await base44.functions.invoke('updateReviewStatus', {
        reviewId: review.id,
        status: 'rejected',
      });
      toast.success('Document rejected');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Review Not Found</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!reviewData || !review) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{review.title}</h1>
              {review.description && (
                <p className="text-slate-600 mt-2">{review.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span
                  className={cn(
                    'text-xs font-medium px-3 py-1 rounded-full',
                    review.status === 'approved' && 'bg-green-100 text-green-700',
                    review.status === 'rejected' && 'bg-red-100 text-red-700',
                    review.status === 'commented' && 'bg-blue-100 text-blue-700',
                    review.status === 'pending' && 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
                {review.due_date && (
                  <span className="text-sm text-slate-600">
                    Due: {format(new Date(review.due_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Files */}
        {review.file_urls?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Files for Review</h2>
            <div className="space-y-2">
              {review.file_urls.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.filename}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(file.uploaded_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Comments ({review.comments?.length || 0})
          </h2>

          {/* Existing Comments */}
          {review.comments?.length > 0 && (
            <div className="space-y-3 mb-6">
              {review.comments.map((c) => (
                <div key={c.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{c.author}</p>
                      <p className="text-xs text-slate-500">{c.author_email}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(new Date(c.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <p className="text-slate-700">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-medium text-slate-900 mb-4">Add Your Feedback</h3>
            <div className="space-y-3">
              <Input
                placeholder="Your name *"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Your email *"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
              />
              <Textarea
                placeholder="Your comment or feedback *"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleAddComment}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Sending...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}