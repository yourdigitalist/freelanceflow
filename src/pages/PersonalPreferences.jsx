import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const preference = preferences[0] || { date_format: 'DD-MM-YYYY', time_format: '24h' };

  const [dateFormat, setDateFormat] = useState(preference.date_format || 'DD-MM-YYYY');
  const [timeFormat, setTimeFormat] = useState(preference.time_format || '24h');

  useEffect(() => {
    if (preference) {
      setDateFormat(preference.date_format || 'DD-MM-YYYY');
      setTimeFormat(preference.time_format || '24h');
    }
  }, [preference]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preference.id) {
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

  const handleSave = () => {
    saveMutation.mutate({ date_format: dateFormat, time_format: timeFormat });
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
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}