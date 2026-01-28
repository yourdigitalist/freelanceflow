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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#94A3B8', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
];

export default function ProjectStatusManagementDialog({ 
  open, 
  onOpenChange, 
  projectId,
  currentStatuses = [],
  templates = [],
  onSave,
  onSaveAsTemplate 
}) {
  const [statuses, setStatuses] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (currentStatuses.length > 0) {
        // Preserve IDs and ownership for proper update/create/delete logic
        setStatuses(currentStatuses.map((s) => ({
          id: s.id,                    // ✅ KEEP THE ID
          name: s.name,
          key: s.key,
          color: s.color,
          order: s.order,
          is_done: s.is_done || false,
          project_id: projectId,
          created_by: s.created_by     // ✅ KEEP OWNERSHIP
        })));
      }
    }
  }, [open, currentStatuses, projectId]);

  const addStatus = () => {
    const newOrder = statuses.length;
    setStatuses([
      ...statuses,
      {
        name: '',
        key: '',
        color: PRESET_COLORS[newOrder % PRESET_COLORS.length],
        order: newOrder,
        is_done: false,
        project_id: projectId,
      }
    ]);
  };

  const updateStatus = (index, field, value) => {
    const updated = [...statuses];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-generate key from name
    if (field === 'name') {
      updated[index].key = value.toLowerCase().replace(/\s+/g, '_');
    }
    
    setStatuses(updated);
  };

  const removeStatus = (index) => {
    const updated = statuses.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((s, i) => s.order = i);
    setStatuses(updated);
  };

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newStatuses = template.statuses.map((s, i) => ({
        ...s,
        is_done: s.is_done || (s.key === 'done'),
        order: i,
        project_id: projectId,
      }));
      setStatuses(newStatuses);
      toast.success('Template applied');
    }
  };

  const handleSave = async () => {
    const hasEmpty = statuses.some(s => !s.name.trim() || !s.key.trim());
    if (hasEmpty) {
      toast.error('All statuses must have a name');
      return;
    }
    if (statuses.length === 0) {
      toast.error('You must have at least one status');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(statuses);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    onSaveAsTemplate(templateName, statuses);
    setTemplateName('');
    setShowTemplateSave(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Project Statuses</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Apply Template */}
          {templates.length > 0 && (
            <div>
              <Label>Apply Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.is_default && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Statuses List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Statuses</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStatus}>
                <Plus className="w-4 h-4 mr-2" />
                Add Status
              </Button>
            </div>

            <div className="space-y-3">
              {statuses.map((status, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Status name (e.g., To Do)"
                      value={status.name}
                      onChange={(e) => updateStatus(index, 'name', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`done-${index}`}
                        checked={status.is_done || false}
                        onCheckedChange={(checked) => updateStatus(index, 'is_done', checked)}
                      />
                      <label
                        htmlFor={`done-${index}`}
                        className="text-sm text-slate-600 cursor-pointer"
                      >
                        Mark as "Done" status
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border-2 transition-all"
                          style={{ 
                            backgroundColor: color,
                            borderColor: status.color === color ? '#1e293b' : 'transparent'
                          }}
                          onClick={() => updateStatus(index, 'color', color)}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStatus(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Save as Template */}
          {!showTemplateSave ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplateSave(true)}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <Label>Template Name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Default Workflow"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTemplateSave(false);
                    setTemplateName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}