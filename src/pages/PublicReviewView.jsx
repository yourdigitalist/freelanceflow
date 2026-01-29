import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download, FileText, Send, Check, X, Eye, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ImageViewer from '../components/reviews/ImageViewer';

export default function PublicReviewView() {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generalComment, setGeneralComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  
  // Visitor info - pre-filled from client data
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorInfoSaved, setVisitorInfoSaved] = useState(false);
  
  // Password protection
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);

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

        // Check if password is required
        if (response.data?.review?.password) {
          setPasswordRequired(true);
          setLoading(false);
          return;
        }

        setReviewData(response.data);

        // Pre-fill visitor info from client data
        const client = response.data?.client;
        if (client) {
          const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ');
          setVisitorName(fullName);
          setVisitorEmail(client.email || '');
          
          // Check if visitor info was already saved in localStorage
          const savedName = localStorage.getItem('reviewVisitorName');
          const savedEmail = localStorage.getItem('reviewVisitorEmail');
          if (savedName && savedEmail) {
            setVisitorName(savedName);
            setVisitorEmail(savedEmail);
            setVisitorInfoSaved(true);
          } else if (fullName && client.email) {
            setVisitorInfoSaved(true);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Review not found');
        setLoading(false);
      }
    };

    loadReview();
  }, []);

  const verifyPassword = async () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let token = searchParams.get('token');
      
      if (!token) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
        token = hashParams.get('token');
      }

      const response = await base44.functions.invoke('getReviewByShareToken', { 
        token,
        password: passwordInput 
      });
      
      setReviewData(response.data);
      setPasswordVerified(true);
      setPasswordRequired(false);
      
      // Pre-fill visitor info from client data
      const client = response.data?.client;
      if (client) {
        const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ');
        setVisitorName(fullName);
        setVisitorEmail(client.email || '');
        
        const savedName = localStorage.getItem('reviewVisitorName');
        const savedEmail = localStorage.getItem('reviewVisitorEmail');
        if (savedName && savedEmail) {
          setVisitorName(savedName);
          setVisitorEmail(savedEmail);
          setVisitorInfoSaved(true);
        } else if (fullName && client.email) {
          setVisitorInfoSaved(true);
        }
      }
    } catch (err) {
      toast.error('Incorrect password');
    }
  };

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

  const saveVisitorInfo = () => {
    if (!visitorName.trim() || !visitorEmail.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    localStorage.setItem('reviewVisitorName', visitorName);
    localStorage.setItem('reviewVisitorEmail', visitorEmail);
    setVisitorInfoSaved(true);
    toast.success('Info saved! You can now add comments');
  };

  const handleAddFileComment = async (commentData) => {
    if (!visitorInfoSaved) {
      toast.error('Please save your info first');
      return;
    }

    try {
      await base44.functions.invoke('updateReviewFileComments', {
        reviewId: review.id,
        operation: 'add',
        comment: {
          author: visitorName,
          author_email: visitorEmail,
          text: commentData.text,
          file_index: commentData.file_index,
          coordinates: commentData.coordinates,
          resolved: false,
        },
      });

      // Send notification email to review owner
      await base44.functions.invoke('sendReviewNotification', {
        reviewId: review.id,
        type: 'comment',
        commenterName: visitorName,
        commenterEmail: visitorEmail,
      });

      toast.success('Comment added');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleEditFileComment = async (commentId, newText) => {
    try {
      await base44.functions.invoke('updateReviewFileComments', {
        reviewId: review.id,
        operation: 'edit',
        commentId,
        comment: { text: newText },
      });

      toast.success('Comment updated');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteFileComment = async (commentId) => {
    try {
      await base44.functions.invoke('updateReviewFileComments', {
        reviewId: review.id,
        operation: 'delete',
        commentId,
      });

      toast.success('Comment deleted');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleAddGeneralComment = async () => {
    if (!generalComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!visitorInfoSaved) {
      toast.error('Please save your info first');
      return;
    }

    setSubmitting(true);
    try {
      const newComment = {
        id: Date.now().toString(),
        author: visitorName,
        author_email: visitorEmail,
        text: generalComment,
        created_at: new Date().toISOString(),
      };

      const updatedComments = [...(review.comments || []), newComment];

      await base44.functions.invoke('updateReviewComment', {
        reviewId: review.id,
        comments: updatedComments,
      });

      // Send notification email to review owner
      await base44.functions.invoke('sendReviewNotification', {
        reviewId: review.id,
        type: 'comment',
        commenterName: visitorName,
        commenterEmail: visitorEmail,
      });

      setGeneralComment('');
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

      // Send notification email to review owner
      await base44.functions.invoke('sendReviewNotification', {
        reviewId: review.id,
        type: 'approved',
        commenterName: visitorName,
        commenterEmail: visitorEmail,
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

      // Send notification email to review owner
      await base44.functions.invoke('sendReviewNotification', {
        reviewId: review.id,
        type: 'rejected',
        commenterName: visitorName,
        commenterEmail: visitorEmail,
      });

      toast.success('Document rejected');
      await reloadReview();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const openViewer = (index) => {
    if (!visitorInfoSaved) {
      toast.error('Please confirm your name and email first to start reviewing');
      return;
    }
    setSelectedFileIndex(index);
    setViewerOpen(true);
  };

  if (passwordRequired && !passwordVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Required</h1>
            <p className="text-slate-600">This review is password protected</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
            />
            <Button
              onClick={verifyPassword}
              className="w-full bg-[#9B63E9] hover:bg-[#8A52D8]"
            >
              Unlock Review
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#9B63E9] border-t-transparent"></div>
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

  const allFileComments = reviewData?.review?.file_comments || [];
  const generalComments = reviewData?.review?.comments || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{review.title}</h1>
              {review.description && (
                <div className="bg-[#9B63E9]/5 border border-[#9B63E9]/20 rounded-lg p-4 mt-3">
                  <p className="text-sm text-slate-600 whitespace-pre-line">{review.description}</p>
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span
                  className={cn(
                    'text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2',
                    review.status === 'approved' && 'bg-[#9B63E9] text-white shadow-lg',
                    review.status === 'rejected' && 'bg-red-500 text-white shadow-lg',
                    review.status === 'commented' && 'bg-[#9B63E9]/10 text-[#9B63E9]',
                    review.status === 'pending' && 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {review.status === 'approved' && <Check className="w-4 h-4" />}
                  {review.status === 'rejected' && <X className="w-4 h-4" />}
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
                <span className="text-sm text-slate-600 font-medium">
                  Version {review.version || 1}
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

        {/* Visitor Info */}
        {!visitorInfoSaved && (
          <div className="bg-[#9B63E9]/5 border border-[#9B63E9]/20 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">👤 Who's reviewing?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter your info once to start adding comments to files
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
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
            </div>
            <Button
              onClick={saveVisitorInfo}
              className="bg-[#9B63E9] hover:bg-[#8A52D8]"
            >
              Save & Continue
            </Button>
          </div>
        )}

        {visitorInfoSaved && (
          <div className="bg-white border border-[#9B63E9]/20 rounded-lg p-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#9B63E9]" />
              <span className="text-sm text-slate-700">
                Reviewing as <strong>{visitorName}</strong> ({visitorEmail})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisitorInfoSaved(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              Change
            </Button>
          </div>
        )}

        {/* Files */}
        {review.file_urls?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Files for Review</h2>
            <div className="space-y-2">
              {review.file_urls.map((file, idx) => {
                const fileCommentsCount = allFileComments.filter(c => c.file_index === idx).length;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-[#9B63E9] hover:bg-[#9B63E9]/5 transition-colors group"
                  >
                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-[#9B63E9]" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{file.filename}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-500">
                          {format(new Date(file.uploaded_date), 'MMM d, yyyy')}
                        </p>
                        {fileCommentsCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <MessageCircle className="w-3 h-3" />
                            <span>{fileCommentsCount} comment{fileCommentsCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewer(idx)}
                        className="group-hover:border-[#9B63E9] group-hover:text-[#9B63E9]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* General Comments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            General Comments ({generalComments.length})
          </h2>

          {/* Existing General Comments */}
          {generalComments.length > 0 && (
            <div className="space-y-3 mb-6">
              {generalComments.map((c) => (
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

          {/* Add General Comment Form */}
          {visitorInfoSaved && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-medium text-slate-900 mb-4">Add Overall Feedback</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Share your overall thoughts about this review..."
                  value={generalComment}
                  onChange={(e) => setGeneralComment(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleAddGeneralComment}
                  disabled={submitting || !generalComment.trim()}
                  className="bg-[#9B63E9] hover:bg-[#8A52D8] w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Sending...' : 'Add General Comment'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {visitorInfoSaved && (
          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              className="flex-1 bg-[#9B63E9] hover:bg-[#8A52D8]"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && (
        <>
          {console.log('ImageViewer Props:', {
            comments: allFileComments,
            fileComments: allFileComments.filter(c => c.file_index === selectedFileIndex),
            selectedFileIndex,
            reviewData
          })}
          <ImageViewer
            key={`viewer-${allFileComments.length}-${selectedFileIndex}`}
            files={review.file_urls}
            initialIndex={selectedFileIndex}
            onClose={() => setViewerOpen(false)}
            comments={allFileComments}
            onAddComment={handleAddFileComment}
            onEditComment={handleEditFileComment}
            onDeleteComment={handleDeleteFileComment}
            visitorName={visitorName}
            visitorEmail={visitorEmail}
          />
        </>
      )}
    </div>
  );
}