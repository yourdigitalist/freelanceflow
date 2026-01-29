import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, Save, Palette } from 'lucide-react';
import AvatarUpload from '../components/user/AvatarUpload';
import { toast } from 'sonner';

export default function EmailSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ['emailSettings', user?.email],
    queryFn: async () => {
      const settings = await base44.entities.EmailSettings.filter({ created_by: user.email });
      return settings[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: companyProfile } = useQuery({
    queryKey: ['companyProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.CompanyProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast.success('Email settings saved');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailSettings.update(emailSettings.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      toast.success('Email settings updated');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const dataToSave = {
      header_color: formData.header_color || '#9B63E9',
      button_color: formData.button_color || '#9B63E9',
      logo_url: formData.logo_url || '',
      footer_text: formData.footer_text || '',
    };

    if (emailSettings) {
      updateMutation.mutate(dataToSave);
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  React.useEffect(() => {
    if (emailSettings) {
      setFormData(emailSettings);
    } else if (companyProfile) {
      setFormData({
        header_color: '#9B63E9',
        button_color: '#9B63E9',
        logo_url: companyProfile.logo_url || '',
        footer_text: '',
      });
    }
  }, [emailSettings, companyProfile]);

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

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8 text-[#9B63E9]" />
          <h1 className="text-3xl font-bold text-slate-900">Email Settings</h1>
        </div>
        <p className="text-slate-600">Customize how your emails appear to clients</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <Label>Email Logo</Label>
            <p className="text-sm text-slate-500 mb-2">
              Logo displayed in email headers (defaults to company logo)
            </p>
            <AvatarUpload
              currentAvatarUrl={formData.logo_url || companyProfile?.logo_url}
              userName={companyProfile?.company_name || 'Logo'}
              onUploadSuccess={(url) => setFormData({ ...formData, logo_url: url })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="header_color">Header Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="header_color"
                  type="color"
                  value={formData.header_color || '#9B63E9'}
                  onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.header_color || '#9B63E9'}
                  onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                  placeholder="#9B63E9"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="button_color">Button Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="button_color"
                  type="color"
                  value={formData.button_color || '#9B63E9'}
                  onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.button_color || '#9B63E9'}
                  onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                  placeholder="#9B63E9"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="footer_text">Footer Text</Label>
            <p className="text-sm text-slate-500 mb-2">
              Custom text shown at the bottom of emails
            </p>
            <Textarea
              id="footer_text"
              value={formData.footer_text || ''}
              onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              placeholder="Thank you for your business!"
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <Label className="mb-3 block">Preview</Label>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div 
                className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg"
              >
                <div 
                  className="p-6 text-center text-white"
                  style={{ backgroundColor: formData.header_color || '#9B63E9' }}
                >
                  {(formData.logo_url || companyProfile?.logo_url) && (
                    <img 
                      src={formData.logo_url || companyProfile?.logo_url} 
                      alt="Logo" 
                      className="h-12 mx-auto mb-2 object-contain"
                    />
                  )}
                  <h3 className="font-bold text-lg">{companyProfile?.company_name || 'Your Business'}</h3>
                </div>
                <div className="p-6 text-center">
                  <p className="text-slate-600 mb-4">Email content goes here...</p>
                  <button 
                    type="button"
                    className="px-6 py-2 text-white rounded-lg font-semibold"
                    style={{ backgroundColor: formData.button_color || '#9B63E9' }}
                  >
                    View Invoice
                  </button>
                </div>
                {formData.footer_text && (
                  <div className="p-4 bg-slate-50 text-center border-t">
                    <p className="text-xs text-slate-500">{formData.footer_text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#9B63E9] hover:bg-[#8A52D8]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}