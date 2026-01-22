import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import PageHeader from '../components/shared/PageHeader';
import { cn } from "@/lib/utils";

const colorOptions = [
  { value: 'bg-slate-100', label: 'Slate', preview: 'bg-slate-100' },
  { value: 'bg-blue-50', label: 'Blue', preview: 'bg-blue-100' },
  { value: 'bg-amber-50', label: 'Amber', preview: 'bg-amber-100' },
  { value: 'bg-emerald-50', label: 'Emerald', preview: 'bg-emerald-100' },
  { value: 'bg-purple-50', label: 'Purple', preview: 'bg-purple-100' },
  { value: 'bg-rose-50', label: 'Rose', preview: 'bg-rose-100' },
  { value: 'bg-cyan-50', label: 'Cyan', preview: 'bg-cyan-100' },
];

export default function TaskStatuses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    color: 'bg-slate-100',
    order: 0,
  });

  const queryClient = useQueryClient();

  const { data: statuses = [] } = useQuery({
    queryKey: ['taskStatuses'],
    queryFn: () => base44.entities.TaskStatus.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskStatus.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskStatuses'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskStatus.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskStatuses'] });
      setDialogOpen(false);
      setEditingStatus(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskStatus.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskStatuses'] });
      setDeleteStatus(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      color: 'bg-slate-100',
      order: statuses.length + 1,
    });
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      key: status.key,
      color: status.color || 'bg-slate-100',
      order: status.order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      key: formData.key || formData.name.toLowerCase().replace(/\s+/g, '_'),
    };
    
    if (editingStatus) {
      await updateMutation.mutateAsync({ id: editingStatus.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Task Statuses"
        description="Customize your workflow by managing task status columns"
        action={{
          label: "Add Status",
          onClick: () => {
            setEditingStatus(null);
            resetForm();
            setDialogOpen(true);
          },
        }}
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sortedStatuses.map((status) => (
            <div key={status.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
              <GripVertical className="w-5 h-5 text-slate-400" />
              <div 
                className={cn("w-12 h-12 rounded-xl flex-shrink-0", status.color)}
              />
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{status.name}</h3>
                <p className="text-sm text-slate-500">Key: {status.key}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(status)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteStatus(status)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Edit Status' : 'Add Status'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Status Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., In Development"
                required
              />
            </div>

            <div>
              <Label htmlFor="key">Key (optional)</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="Auto-generated from name"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used internally. Leave empty to auto-generate.
              </p>
            </div>

            <div>
              <Label>Column Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      "h-12 rounded-lg border-2 transition-all",
                      color.preview,
                      formData.color === color.value 
                        ? "border-emerald-500 ring-2 ring-emerald-500/20" 
                        : "border-transparent hover:border-slate-300"
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingStatus ? 'Save Changes' : 'Add Status'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteStatus} onOpenChange={() => setDeleteStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete status?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deleteStatus?.name}" status. Tasks using this status may need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteStatus.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}