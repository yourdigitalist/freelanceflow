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
import EmojiPicker from '../shared/EmojiPicker';

export default function SendForReviewDialog({ open, onOpenChange, project, client, folder: initialFolder, onSuccess }) {
  const [selectedProject, setSelectedProject] = useState(project?.id || '');
  const [selectedClient, setSelectedClient] = useState(client?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [version, setVersion] = useState('1');
  const [folder, setFolder] = useState(initialFolder || '');
  const [files, setFiles] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [folderEmoji, setFolderEmoji] = useState('📁');
  const [folderColor, setFolderColor] = useState('#3b82f6');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allReviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['allReviews', user?.email],
    queryFn: () => base44.entities.ReviewRequest.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const existingFolders = [...new Set(allReviews.filter(r => r.folder).map(r => r.folder))];

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

  useEffect(() => {
    if (initialFolder) setFolder(initialFolder);
  }, [initialFolder]);

  const selectedClientObj = clients.find(c => c.id === selectedClient);

  useEffect(() => {
    if (selectedClientObj?.email && !recipients.includes(selectedClientObj.email)) {
      setRecipients([selectedClientObj.email]);
    }
  }, [selectedClient, selectedClientObj]);

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Files over 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

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
        project_id: selectedProject || null,
        client_id: selectedClient,
        title,
        description,
        file_urls: files,
        version: parseFloat(version) || 1,
        folder: folder || null,
        folder_emoji: folder ? folderEmoji : null,
        folder_color: folder ? folderColor : null,
        share_token: generateShareToken(),
        status: 'pending',
        due_date: dueDate || null,
        recipient_emails: recipients,
        password: passwordProtected ? password : null,
      };

      await base44.entities.ReviewRequest.create(reviewData);
      
      // Send email to recipients
      await base44.functions.invoke('sendReviewEmail', {
        reviewTitle: title,
        recipients,
        shareToken: reviewData.share_token,
        appUrl: window.location.origin,
        password: passwordProtected ? password : null,
      });

      toast.success('Review request sent successfully');
      
      setSelectedProject(project?.id || '');
      setSelectedClient(client?.id || '');
      setTitle('');
      setDescription('');
      setDueDate('');
      setVersion('1');
      setFolder('');
      setFiles([]);
      setRecipients([]);
      setPasswordProtected(false);
      setPassword('');
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
            <Label htmlFor="project">Project (optional)</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                step="0.1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1"
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">Display: v{version}</p>
            </div>
            <div>
              <Label htmlFor="folder">Folder</Label>
              <div className="flex gap-2 mt-2">
                <Select value={folder} onValueChange={setFolder} className="flex-1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select or create folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No folder</SelectItem>
                    {existingFolders.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                    <div className="border-t mt-1 pt-1 px-2 py-1">
                      <button
                        type="button"
                        className="w-full text-left text-sm hover:bg-slate-100 rounded px-2 py-1.5 text-[#9B63E9] font-medium"
                        onClick={async () => {
                          const newFolder = prompt('Enter folder name:');
                          if (newFolder?.trim()) {
                            setFolder(newFolder.trim());
                            await refetchReviews();
                            toast.success(`Folder "${newFolder.trim()}" will be created`);
                          }
                        }}
                      >
                        + Create new folder
                      </button>
                    </div>
                  </SelectContent>
                </Select>
                {folder && (
                  <div className="flex gap-2">
                    <EmojiPicker 
                      value={folderEmoji}
                      onChange={setFolderEmoji}
                      color={folderColor}
                    />
                  </div>
                )}
              </div>
              {folder && (
                <div className="flex gap-2 mt-2">
                  {['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderColor(color)}
                      className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        borderColor: folderColor === color ? '#1e293b' : 'transparent'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
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
            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
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
                    <Loader2 className="w-5 h-5 animate-spin text-[#9B63E9]" />
                    <span className="text-sm text-slate-600">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Click to upload or drag & drop</span>
                    <span className="text-xs text-slate-400">PDF, Images, Documents (max 10MB each)</span>
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

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-[#9B63E9] hover:bg-[#8A52D8]">
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