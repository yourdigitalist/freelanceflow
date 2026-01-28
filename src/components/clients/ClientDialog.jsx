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
import PhoneInput from '../shared/PhoneInput';

const avatarColors = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

export default function ClientDialog({ open, onOpenChange, client, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    phone_country_code: '+1',
    company: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    tax_id: '',
    notes: '',
    status: 'active',
    avatar_color: avatarColors[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        phone_country_code: client.phone_country_code || '+1',
        company: client.company || '',
        street: client.street || '',
        street2: client.street2 || '',
        city: client.city || '',
        state: client.state || '',
        zip: client.zip || '',
        country: client.country || '',
        tax_id: client.tax_id || '',
        notes: client.notes || '',
        status: client.status || 'active',
        avatar_color: client.avatar_color || avatarColors[0],
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        phone_country_code: '+1',
        company: '',
        street: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        tax_id: '',
        notes: '',
        status: 'active',
        avatar_color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      });
    }
  }, [client, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company Inc."
              />
            </div>
          </div>

          <PhoneInput
            label="Phone"
            value={formData.phone}
            countryCode={formData.phone_country_code}
            onChange={(phone, countryCode) => setFormData({ 
              ...formData, 
              phone, 
              phone_country_code: countryCode 
            })}
          />

          <div>
            <Label htmlFor="tax_id">Tax Identification Number</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="Tax ID / VAT number"
            />
          </div>

          <div className="space-y-3">
            <Label>Address</Label>
            <Input
              placeholder="Street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            />
            <Input
              placeholder="Street 2"
              value={formData.street2}
              onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                placeholder="State/Province"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="ZIP/Postal Code"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
              <Input
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Avatar Color</Label>
            <div className="flex gap-2 mt-2">
              {avatarColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${formData.avatar_color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, avatar_color: color })}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes about this client..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : (client ? 'Save Changes' : 'Add Client')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}