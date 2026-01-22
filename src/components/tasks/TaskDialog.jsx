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
import { Plus, X } from 'lucide-react';

export default function TaskDialog({ open, onOpenChange, task, taskStatuses, parentTask, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status_id: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    parent_task_id: '',
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task && task.id) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status_id: task.status_id || (taskStatuses?.[0]?.id || ''),
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours || '',
        parent_task_id: task.parent_task_id || '',
      });
      setSubtasks([]);
    } else {
      setFormData({
        title: '',
        description: '',
        status_id: task?.status_id || parentTask?.status_id || (taskStatuses?.[0]?.id || ''),
        priority: 'medium',
        due_date: '',
        estimated_hours: '',
        parent_task_id: parentTask?.id || '',
      });
      setSubtasks([]);
    }
    setNewSubtask('');
  }, [task, parentTask, taskStatuses, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dataToSave = {
      ...formData,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
    };
    await onSave(dataToSave, subtasks);
    setSaving(false);
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { title: newSubtask.trim(), priority: 'medium' }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : parentTask ? `Add Subtask to: ${parentTask.title}` : 'Add Task'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Design homepage mockup"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status_id}
                onValueChange={(value) => setFormData({ ...formData, status_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses?.map(status => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
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
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="estimated_hours">Est. Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="2"
              />
            </div>
          </div>

          {!task && !parentTask && (
            <div>
              <Label>Subtasks (optional)</Label>
              <div className="mt-2 space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm text-slate-700">{subtask.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSubtask(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : (task ? 'Save Changes' : 'Add Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}