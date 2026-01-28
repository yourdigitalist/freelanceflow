import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const projectColors = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export default function ProjectDialog({ open, onOpenChange, project, clients = [], onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    due_date: '',
    budget: '',
    hourly_rate: '',
    billing_type: 'hourly',
    color: projectColors[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        client_id: project.client_id || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        budget: project.budget || '',
        hourly_rate: project.hourly_rate || '',
        billing_type: project.billing_type || 'hourly',
        color: project.color || projectColors[0],
      });
    } else {
      setFormData({
        name: '',
        client_id: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        due_date: '',
        budget: '',
        hourly_rate: '',
        billing_type: 'hourly',
        color: projectColors[Math.floor(Math.random() * projectColors.length)],
      });
    }
  }, [project, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dataToSave = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
    };
    await onSave(dataToSave);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Website Redesign"
              required
            />
          </div>

          <div>
            <Label htmlFor="client">Client (optional)</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Client</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {[client.first_name, client.last_name].filter(Boolean).join(' ') || client.company || 'Unnamed Client'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project scope and details..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="folder">Folder (optional)</Label>
            <Input
              id="folder"
              value={formData.folder || ''}
              onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
              placeholder="e.g., Client Work, Internal, Marketing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billing_type">Billing Type</Label>
              <Select
                value={formData.billing_type}
                onValueChange={(value) => setFormData({ ...formData, billing_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hourly_rate">
                {formData.billing_type === 'hourly' ? 'Hourly Rate ($)' : 'Budget ($)'}
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.billing_type === 'hourly' ? formData.hourly_rate : formData.budget}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  [formData.billing_type === 'hourly' ? 'hourly_rate' : 'budget']: e.target.value 
                })}
                placeholder={formData.billing_type === 'hourly' ? '75' : '5000'}
              />
            </div>
          </div>

          <div>
            <Label>Project Color</Label>
            <div className="flex gap-2 mt-2">
              {projectColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : (project ? 'Save Changes' : 'Create Project')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}