import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Building2, Save, Upload, AlertCircle } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];

export default function CompanySettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['companyProfile', user?.id],
    queryFn: () => {
      if (!user?.id) return null;
      return base44.entities.CompanyProfile.filter({ user_id: user.id }).then(results => results[0]);
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.CompanyProfile.update(company.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.CompanyProfile.delete(company.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      setShowDeleteDialog(false);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">No company profile yet</h3>
            <p className="text-sm text-blue-700">Please complete onboarding first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-emerald-600" />
          <h1 className="text-3xl font-bold text-slate-900">Company Settings</h1>
        </div>
        <p className="text-slate-600">Manage your company information and billing details</p>
      </div>

      <Card className="p-6 space-y-6">
        {!isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-600">Company Name</p>
                <p className="text-lg text-slate-900 mt-1">{company.company_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Email</p>
                <p className="text-lg text-slate-900 mt-1">{company.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Phone</p>
                <p className="text-lg text-slate-900 mt-1">{company.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Website</p>
                <p className="text-lg text-slate-900 mt-1">{company.website || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Currency</p>
                <p className="text-lg text-slate-900 mt-1">{company.currency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Timezone</p>
                <p className="text-lg text-slate-900 mt-1">{company.timezone}</p>
              </div>
            </div>

            {company.street && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-600 mb-2">Address</p>
                <p className="text-slate-900">{company.street}</p>
                {company.street2 && <p className="text-slate-900">{company.street2}</p>}
                <p className="text-slate-900">
                  {company.city}, {company.state} {company.zip}
                </p>
                <p className="text-slate-900">{company.country}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setFormData(company);
                  setIsEditing(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Information
              </Button>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
              >
                Delete Profile
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(formData);
          }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Street Address</Label>
              <Input
                value={formData.street || ''}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={formData.zip || ''}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Tax ID</Label>
                <Input
                  value={formData.tax_id || ''}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Currency</Label>
                <Select value={formData.currency || 'USD'} onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={formData.timezone || 'UTC'} onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const Edit = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);