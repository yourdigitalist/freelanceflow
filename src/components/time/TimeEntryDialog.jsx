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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

export default function TimeEntryDialog({ open, onOpenChange, entry, projects = [], tasks = [], onSave }) {
  const [formData, setFormData] = useState({
    project_id: '',
    task_id: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    billable: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        project_id: entry.project_id || '',
        task_id: entry.task_id || '',
        description: entry.description || '',
        date: entry.date || format(new Date(), 'yyyy-MM-dd'),
        hours: entry.hours || '',
        billable: entry.billable !== false,
      });
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('project');
      setFormData({
        project_id: projectId || '',
        task_id: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: '',
        billable: true,
      });
    }
  }, [entry, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dataToSave = {
      ...formData,
      hours: parseFloat(formData.hours),
    };
    await onSave(dataToSave);
    setSaving(false);
  };

  const projectTasks = tasks.filter(t => t.project_id === formData.project_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Time Entry' : 'Log Time'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="project">Project *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value, task_id: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projectTasks.length > 0 && (
            <div>
              <Label htmlFor="task">Task (optional)</Label>
              <Select
                value={formData.task_id}
                onValueChange={(value) => setFormData({ ...formData, task_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="2.5"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <Label htmlFor="billable" className="cursor-pointer">Billable time</Label>
            <Switch
              id="billable"
              checked={formData.billable}
              onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#9B63E9] hover:bg-[#8A52D8]">
              {saving ? 'Saving...' : (entry ? 'Save Changes' : 'Log Time')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}