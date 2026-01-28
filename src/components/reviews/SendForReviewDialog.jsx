import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function SendForReviewDialog({ open, onOpenChange, project, client, onSuccess }) {
  const [selectedProject, setSelectedProject] = useState(project?.id || '');
  const [selectedClient, setSelectedClient] = useState(client?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (project) setSelectedProject(project.id);
  }, [project]);

  useEffect(() => {
    if (client) {
      setSelectedClient(client.id);
      if (client.email && !recipients.includes(client.email)) {
        setRecipients([client.email]);
      }
    }
  }, [client]);

  const selectedClientObj = clients.find(c => c.id === selectedClient);

  useEffect(() => {
    if (selectedClientObj && !recipients.includes(selectedClientObj.email)) {
      setRecipients([selectedClientObj.email]);
    }
  }, [selectedClient]);

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

  const addRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (email) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient email');
      return;
    }

    setSaving(true);
    try {
      const reviewData = {
        project_id: selectedProject,
        client_id: selectedClient,
        title,
        description,
        file_urls: files,
        share_token: generateShareToken(),
        status: 'pending',
        due_date: dueDate || null,
        recipient_emails: recipients,
      };

      await base44.entities.ReviewRequest.create(reviewData);
      
      // Send email to recipients
      await base44.functions.invoke('sendReviewEmail', {
        reviewTitle: title,
        recipients,
        shareToken: reviewData.share_token,
        appUrl: window.location.origin,
      });

      toast.success('Review request sent successfully');
      
      setSelectedProject(project?.id || '');
      setSelectedClient(client?.id || '');
      setTitle('');
      setDescription('');
      setDueDate('');
      setFiles([]);
      setRecipients([]);
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
            Create a review request and send to clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="project">Project *</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client">Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

          <div>
           <Label>Recipients *</Label>
           <div className="mt-2 space-y-2">
             <div className="flex gap-2">
               <Input
                 placeholder="Email address"
                 value={newRecipient}
                 onChange={(e) => setNewRecipient(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
               />
               <Button type="button" size="sm" onClick={addRecipient} variant="outline">
                 <Plus className="w-4 h-4" />
               </Button>
             </div>
             {recipients.length > 0 && (
               <div className="space-y-1">
                 {recipients.map((email) => (
                   <div key={email} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                     <span className="text-sm text-slate-700">{email}</span>
                     <button
                       onClick={() => removeRecipient(email)}
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