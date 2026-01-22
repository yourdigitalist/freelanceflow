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

export default function StatusDialog({ open, onOpenChange, status, statuses = [], onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    color: '#94A3B8',
    order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name || '',
        key: status.key || '',
        color: status.color || '#94A3B8',
        order: status.order || 0,
      });
    } else {
      setFormData({
        name: '',
        key: '',
        color: '#94A3B8',
        order: statuses.length,
      });
    }
  }, [status, statuses, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{status ? 'Edit Status' : 'Add Status'}</DialogTitle>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : (status ? 'Save Changes' : 'Add Status')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}