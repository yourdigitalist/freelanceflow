import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Copy, ExternalLink, Loader2, Trash2, Send, Download, Eye, MessageCircle, Check, X } from 'lucide-react';
import EmojiPicker from '../components/shared/EmojiPicker';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ImageViewer from '../components/reviews/ImageViewer';

export default function ReviewRequestDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(window.location.search);
  const reviewId = searchParams.get('id');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [editingFolder, setEditingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: review, isLoading } = useQuery({
    queryKey: ['reviewRequest', reviewId],
    queryFn: async () => {
      const reviews = await base44.entities.ReviewRequest.filter({ id: reviewId });
      return reviews[0];
    },
    enabled: !!reviewId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', review?.client_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: review.client_id });
      return clients[0];
    },
    enabled: !!review?.client_id,
  });

  const { data: project } = useQuery({
    queryKey: ['project', review?.project_id],
    queryFn: async () => {
      if (!review.project_id) return null;
      const projects = await base44.entities.Project.filter({ id: review.project_id });
      return projects[0];
    },
    enabled: !!review?.project_id,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews', user?.email],
    queryFn: () => base44.entities.ReviewRequest.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const existingFolders = [...new Set(allReviews.filter(r => r.folder).map(r => r.folder))];

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ReviewRequest.delete(reviewId),
    onSuccess: () => {
      toast.success('Review request deleted');
      navigate('/ReviewRequests');
    },
    onError: () => {
      toast.error('Failed to delete review request');
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ folder, emoji, color }) => 
      base44.entities.ReviewRequest.update(reviewId, { 
        folder, 
        folder_emoji: emoji,
        folder_color: color 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewRequest', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
      setEditingFolder(false);
      toast.success('Folder updated');
    },
  });

  const copyShareLink = () => {
    const link = `${window.location.origin}/PublicReviewView?token=${review.share_token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleSendReminder = async () => {
    if (!client?.email) {
      toast.error('Client email not found');
      return;
    }

    setSendingReminder(true);
    try {
      await base44.functions.invoke('sendReviewEmail', {
        reviewTitle: review.title,
        recipients: [client.email],
        shareToken: review.share_token,
        appUrl: window.location.origin,
      });
      toast.success('Reminder sent successfully');
    } catch (error) {
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    commented: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-green-500 text-white border-green-500',
    rejected: 'bg-red-500 text-white border-red-500',
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9B63E9]" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Review request not found</p>
      </div>
    );
  }

  const allFileComments = review.file_comments || [];
  const generalComments = review.comments || [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ReviewRequests')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reviews
        </Button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{review.title}</h1>
              {review.description && (
                <p className="text-slate-600 mb-3">{review.description}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={cn(
                    'text-sm font-semibold px-4 py-2 rounded-lg border flex items-center gap-2',
                    statusColors[review.status]
                  )}
                >
                  {review.status === 'approved' && <Check className="w-4 h-4" />}
                  {review.status === 'rejected' && <X className="w-4 h-4" />}
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
                {editingFolder ? (
                  <div className="flex items-center gap-2">
                    <Select value={newFolder || '__none__'} onValueChange={(val) => setNewFolder(val === '__none__' ? '' : val)}>
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No folder</SelectItem>
                        {existingFolders.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                        <div className="border-t mt-1 pt-1 px-2">
                          <button
                            type="button"
                            className="w-full text-left text-sm hover:bg-slate-100 rounded px-2 py-1.5 text-[#9B63E9] font-medium"
                            onClick={() => {
                              const name = prompt('Enter new folder name:');
                              if (name?.trim()) setNewFolder(name.trim());
                            }}
                          >
                            + Create new
                          </button>
                        </div>
                      </SelectContent>
                    </Select>
                    {newFolder && (
                      <>
                        <EmojiPicker 
                          value={newFolderEmoji}
                          onChange={setNewFolderEmoji}
                          color={newFolderColor}
                        />
                        <div className="flex gap-1">
                          {['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewFolderColor(color)}
                              className="w-5 h-5 rounded-full border-2 transition-all"
                              style={{ 
                                backgroundColor: color,
                                borderColor: newFolderColor === color ? '#1e293b' : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={() => updateFolderMutation.mutate({ 
                        folder: newFolder, 
                        emoji: newFolderEmoji, 
                        color: newFolderColor 
                      })}
                      disabled={updateFolderMutation.isPending}
                      className="bg-[#9B63E9] hover:bg-[#8A52D8]"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingFolder(false);
                        setNewFolder('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <span 
                    className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => {
                      setNewFolder(review.folder || '');
                      setNewFolderEmoji(review.folder_emoji || '📁');
                      setNewFolderColor(review.folder_color || '#3b82f6');
                      setEditingFolder(true);
                    }}
                  >
                    {review.folder_emoji || '📁'} {review.folder || 'No folder'} ✏️
                  </span>
                )}
                <span className="text-xs text-slate-500">v{review.version || 1}</span>
                {review.due_date && (
                  <span className="text-xs text-slate-500">
                    Due: {format(new Date(review.due_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Project Info */}
          <div className="grid sm:grid-cols-2 gap-4 py-4 border-y border-slate-100">
            <div>
              <p className="text-xs text-slate-500 mb-1">Client</p>
              <p className="font-medium text-slate-900">
                {client ? `${client.first_name} ${client.last_name}` : 'Loading...'}
              </p>
              {client?.email && (
                <p className="text-sm text-slate-600">{client.email}</p>
              )}
            </div>
            {review.project_id && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Project</p>
                <p className="font-medium text-slate-900">
                  {project ? project.name : 'Loading...'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled={sendingReminder}
            >
              {sendingReminder ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Reminder
            </Button>
            <Button variant="outline" size="sm" onClick={copyShareLink}>
              {copiedLink ? (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/PublicReviewView?token=${review.share_token}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View as Client
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Files */}
      {review.file_urls?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Files ({review.file_urls.length})</h2>
          <div className="space-y-2">
            {review.file_urls.map((file, idx) => {
              const fileCommentsCount = allFileComments.filter(c => c.file_index === idx).length;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500">
                        {format(new Date(file.uploaded_date), 'MMM d, yyyy')}
                      </p>
                      {fileCommentsCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <MessageCircle className="w-3 h-3" />
                          <span>{fileCommentsCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFileIndex(idx);
                        setViewerOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download>
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

      {/* Comments */}
      {generalComments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Comments ({generalComments.length})
          </h2>
          <div className="space-y-3">
            {generalComments.map((comment) => (
              <div key={comment.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{comment.author}</p>
                    <p className="text-xs text-slate-500">{comment.author_email}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <p className="text-slate-700">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{review.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer */}
      {viewerOpen && (
        <ImageViewer
          files={review.file_urls}
          initialIndex={selectedFileIndex}
          onClose={() => setViewerOpen(false)}
          comments={allFileComments}
          visitorName={user?.full_name}
          visitorEmail={user?.email}
          readOnly={true}
        />
      )}
    </div>
  );
}