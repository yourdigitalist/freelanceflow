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



export default function TaskStatuses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    color: '#94A3B8',
    order: 0,
  });

  const queryClient = useQueryClient();

  // Get current user first
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Filter statuses by current user
  const { data: statuses = [] } = useQuery({
    queryKey: ['taskStatuses', user?.email],
    queryFn: () => base44.entities.TaskStatus.filter({ created_by: user.email }, 'order'),
    enabled: !!user?.email,
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
      color: '#94A3B8',
      order: statuses.length + 1,
    });
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      key: status.key,
      color: status.color || '#94A3B8',
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
                className="w-12 h-12 rounded-xl flex-shrink-0 border border-slate-200"
                style={{ backgroundColor: status.color || '#94A3B8' }}
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
              <Label htmlFor="color">Column Color</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#94A3B8"
                  className="flex-1"
                />
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