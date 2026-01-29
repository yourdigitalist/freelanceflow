import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PageHeader from '../components/shared/PageHeader';
import { Folder, FolderOpen, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SendForReviewDialog from '../components/reviews/SendForReviewDialog';

export default function ReviewRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviewRequests', user?.email],
    queryFn: () => base44.entities.ReviewRequest.filter({ created_by: user.email }, '-updated_date', 100),
    enabled: !!user?.email,
  });

  // Get unique folders from reviews
  const folders = [...new Set(reviews.filter(r => r.folder).map(r => r.folder))];
  const unorganizedReviews = reviews.filter(r => !r.folder);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    setFolderDialogOpen(false);
    setSelectedFolder(newFolderName.trim());
    setDialogOpen(true);
    setNewFolderName('');
  };

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const openReviewDetail = (reviewId) => {
    navigate(createPageUrl(`ReviewRequestDetail?id=${reviewId}`));
  };

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    commented: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  if (isLoading) return <div className="p-6 text-center">Loading reviews...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Requests</h1>
          <p className="text-slate-600 mt-1">Manage work sent for client review</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFolderDialogOpen(true)}
          >
            <Folder className="w-4 h-4 mr-2" />
            Create Folder
          </Button>
          <Button
            onClick={() => {
              setSelectedFolder(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Folders */}
        {folders.map((folder) => {
          const folderReviews = reviews.filter(r => r.folder === folder);
          const isExpanded = expandedFolders[folder];
          
          return (
            <div key={folder} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Folder className="w-5 h-5 text-slate-400" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900">{folder}</h3>
                    <p className="text-sm text-slate-500">{folderReviews.length} review{folderReviews.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFolder(folder);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Review
                  </Button>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-slate-400 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  {folderReviews.map((review) => (
                    <div
                      key={review.id}
                      onClick={() => openReviewDetail(review.id)}
                      className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">{review.title}</h4>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span
                              className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full border',
                                statusColors[review.status]
                              )}
                            >
                              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                            </span>
                            <span className="text-xs text-slate-500">v{review.version || 1}</span>
                            <span className="text-xs text-slate-500">
                              {review.file_urls?.length} file{review.file_urls?.length !== 1 ? 's' : ''}
                            </span>
                            {(review.file_comments?.length > 0) && (
                              <span className="text-xs text-blue-600">💬 {review.file_comments.length}</span>
                            )}
                            <span className="text-xs text-slate-400">
                              {format(new Date(review.created_date), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Unorganized Reviews */}
        {unorganizedReviews.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Unorganized</h3>
            {unorganizedReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => openReviewDetail(review.id)}
                className="bg-white p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{review.title}</h4>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full border',
                          statusColors[review.status]
                        )}
                      >
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500">v{review.version || 1}</span>
                      <span className="text-xs text-slate-500">
                        {review.file_urls?.length} file{review.file_urls?.length !== 1 ? 's' : ''}
                      </span>
                      {(review.file_comments?.length > 0) && (
                        <span className="text-xs text-blue-600">💬 {review.file_comments.length}</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {format(new Date(review.created_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {reviews.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No review requests yet</p>
          </div>
        )}
      </div>

      <SendForReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folder={selectedFolder}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['reviewRequests'] });
          setDialogOpen(false);
          setSelectedFolder(null);
        }}
      />

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Organize your review requests by creating folders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name (e.g., Brand Guidelines, Website)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}