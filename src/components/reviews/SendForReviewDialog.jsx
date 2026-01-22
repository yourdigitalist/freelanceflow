import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function SendForReviewDialog({ open, onOpenChange, project, client, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            url: file_url,
            filename: file.name,
            uploaded_date: new Date().toISOString(),
          };
        })
      );
      setFiles([...files, ...uploadedFiles]);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setSaving(true);
    try {
      const reviewData = {
        project_id: project.id,
        client_id: client.id,
        title,
        description,
        file_urls: files,
        share_token: generateShareToken(),
        status: 'pending',
        due_date: dueDate || null,
      };

      await base44.entities.ReviewRequest.create(reviewData);
      toast.success('Review request sent successfully');
      
      setTitle('');
      setDescription('');
      setDueDate('');
      setFiles([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to send review request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send for Review</DialogTitle>
          <DialogDescription>
            Send work to {client?.first_name} {client?.last_name} for review
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design Mockups v1, Website Copy Review"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes or context about this review..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Files *</Label>
            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="text-sm text-slate-600">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Click to upload or drag & drop</span>
                    <span className="text-xs text-slate-400">PDF, Images, Documents</span>
                  </div>
                )}
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <span className="text-sm text-slate-700 truncate">{file.filename}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || uploading}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {saving ? 'Sending...' : 'Send for Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}