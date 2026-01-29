import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from '../components/shared/PageHeader';
import { toast } from 'sonner';

export default function PersonalPreferences() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: preferences = [] } = useQuery({
    queryKey: ['personalPreferences', user?.email],
    queryFn: () => base44.entities.PersonalPreference.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: notificationPreferences = [] } = useQuery({
    queryKey: ['notificationPreferences', user?.email],
    queryFn: () => base44.entities.NotificationPreference.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const preference = preferences[0];
  const notificationPref = notificationPreferences[0];

  const [dateFormat, setDateFormat] = useState(preference?.date_format || 'DD-MM-YYYY');
  const [timeFormat, setTimeFormat] = useState(preference?.time_format || '24h');
  const [numberFormat, setNumberFormat] = useState(preference?.number_format || '1,000.00');
  const [reviewComments, setReviewComments] = useState(true);
  const [reviewStatusChanges, setReviewStatusChanges] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(true);

  useEffect(() => {
    if (preferences[0]) {
      setDateFormat(preferences[0].date_format || 'DD-MM-YYYY');
      setTimeFormat(preferences[0].time_format || '24h');
      setNumberFormat(preferences[0].number_format || '1,000.00');
    }
  }, [preferences]);

  useEffect(() => {
    if (notificationPreferences[0]) {
      setReviewComments(notificationPreferences[0].review_comments ?? true);
      setReviewStatusChanges(notificationPreferences[0].review_status_changes ?? true);
      setInvoiceReminders(notificationPreferences[0].invoice_reminders ?? true);
    }
  }, [notificationPreferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preference?.id) {
        return base44.entities.PersonalPreference.update(preference.id, data);
      } else {
        return base44.entities.PersonalPreference.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalPreferences'] });
      toast.success('Preferences saved');
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (data) => {
      if (notificationPref?.id) {
        return base44.entities.NotificationPreference.update(notificationPref.id, data);
      } else {
        return base44.entities.NotificationPreference.create({ ...data, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Notification preferences saved');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ date_format: dateFormat, time_format: timeFormat, number_format: numberFormat });
  };

  const handleSaveNotifications = () => {
    saveNotificationsMutation.mutate({
      review_comments: reviewComments,
      review_status_changes: reviewStatusChanges,
      invoice_reminders: invoiceReminders,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Personal Preferences"
        description="Customize your display preferences"
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Date & Time</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (22-01-2026)</SelectItem>
                  <SelectItem value="MM-DD-YYYY">MM-DD-YYYY (01-22-2026)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-01-22)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Format</Label>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Number Format</Label>
              <Select value={numberFormat} onValueChange={setNumberFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,000.00">1,000.00 (US/UK)</SelectItem>
                  <SelectItem value="1.000,00">1.000,00 (EU)</SelectItem>
                  <SelectItem value="1 000,00">1 000,00 (FR/PL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            Save Preferences
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 mt-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h3>
          <p className="text-sm text-slate-600 mb-6">Choose which notifications you want to receive via email and in-app</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <Label className="text-base font-medium">Review Comments</Label>
                <p className="text-sm text-slate-500 mt-1">Get notified when someone comments on your reviews</p>
              </div>
              <Switch
                checked={reviewComments}
                onCheckedChange={setReviewComments}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <Label className="text-base font-medium">Review Status Changes</Label>
                <p className="text-sm text-slate-500 mt-1">Get notified when a review is approved or rejected</p>
              </div>
              <Switch
                checked={reviewStatusChanges}
                onCheckedChange={setReviewStatusChanges}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <Label className="text-base font-medium">Invoice Reminders</Label>
                <p className="text-sm text-slate-500 mt-1">Get notified about upcoming invoice due dates</p>
              </div>
              <Switch
                checked={invoiceReminders}
                onCheckedChange={setInvoiceReminders}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button onClick={handleSaveNotifications} className="bg-emerald-600 hover:bg-emerald-700">
            Save Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
}