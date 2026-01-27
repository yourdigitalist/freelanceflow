import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Upload, Loader2 } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import { toast } from 'sonner';

export default function InvoiceSettings() {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const { data: settings, isLoading } = useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: async () => {
      const list = await base44.entities.InvoiceSettings.list();
      return list[0] || null;
    },
  });

  const [formData, setFormData] = useState({
    business_name: '',
    business_logo: '',
    business_address: '',
    business_email: '',
    business_phone: '',
    invoice_footer: '',
    default_payment_terms: 'Payment due within 30 days.',
    default_tax_rate: 0,
    default_invoice_email_subject: '',
    default_invoice_email_body: '',
    default_reminder_email_subject: '',
    default_reminder_email_body: '',
    enable_reminders: false,
    reminder_days_before_due: 7,
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Populate business info from company profile if not set in invoice settings
  const businessInfo = {
    business_name: formData.business_name || companyProfile?.company_name || '',
    business_logo: formData.business_logo || companyProfile?.logo_url || '',
    business_address: formData.business_address || 
      [companyProfile?.street, companyProfile?.street2, 
       [companyProfile?.city, companyProfile?.state, companyProfile?.zip].filter(Boolean).join(', '),
       companyProfile?.country].filter(Boolean).join('\n') || '',
    business_email: formData.business_email || companyProfile?.email || '',
    business_phone: formData.business_phone || companyProfile?.phone || '',
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.InvoiceSettings.update(settings.id, data);
      } else {
        return base44.entities.InvoiceSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceSettings'] });
      toast.success('Settings saved successfully');
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, business_logo: file_url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Invoice Settings"
        description="Configure your business details and default invoice settings"
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-6">
        {/* Business Information - Read Only from Company Settings */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Business Information</h3>
          <p className="text-sm text-slate-500 mb-4">This information is pulled from your Company Settings and will appear on invoices.</p>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            {businessInfo.business_logo && (
              <div>
                <img src={businessInfo.business_logo} alt="Business logo" className="h-12 w-auto object-contain mb-2" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-600">Business Name</p>
              <p className="text-slate-900">{businessInfo.business_name || '—'}</p>
            </div>
            {businessInfo.business_address && (
              <div>
                <p className="text-sm font-medium text-slate-600">Address</p>
                <p className="text-slate-900 whitespace-pre-line">{businessInfo.business_address}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Email</p>
                <p className="text-slate-900">{businessInfo.business_email || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Phone</p>
                <p className="text-slate-900">{businessInfo.business_phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Defaults */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Invoice Defaults</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="default_payment_terms">Default Payment Terms</Label>
              <Textarea
                id="default_payment_terms"
                value={formData.default_payment_terms}
                onChange={(e) => setFormData({ ...formData, default_payment_terms: e.target.value })}
                placeholder="Payment due within 30 days."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
              <Input
                id="default_tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.default_tax_rate}
                onChange={(e) => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="invoice_footer">Invoice Footer</Label>
              <Textarea
                id="invoice_footer"
                value={formData.invoice_footer}
                onChange={(e) => setFormData({ ...formData, invoice_footer: e.target.value })}
                placeholder="Thank you for your business!"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Email Templates</h3>
          <p className="text-sm text-slate-500 mb-4">Use placeholders: [Client Name], [Invoice Number], [Project Name], [Due Date], [Business Name]</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="default_invoice_email_subject">Default Invoice Email Subject</Label>
              <Input
                id="default_invoice_email_subject"
                value={formData.default_invoice_email_subject}
                onChange={(e) => setFormData({ ...formData, default_invoice_email_subject: e.target.value })}
                placeholder="Invoice [Invoice Number] from [Business Name]"
              />
            </div>
            <div>
              <Label htmlFor="default_invoice_email_body">Default Invoice Email Body</Label>
              <Textarea
                id="default_invoice_email_body"
                value={formData.default_invoice_email_body}
                onChange={(e) => setFormData({ ...formData, default_invoice_email_body: e.target.value })}
                placeholder="Hi [Client Name],

Here is your invoice for [Project Name]. Please let us know if you have any questions.

Thanks,
[Business Name]"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="default_reminder_email_subject">Default Reminder Email Subject</Label>
              <Input
                id="default_reminder_email_subject"
                value={formData.default_reminder_email_subject}
                onChange={(e) => setFormData({ ...formData, default_reminder_email_subject: e.target.value })}
                placeholder="Reminder: Invoice [Invoice Number] Due Soon"
              />
            </div>
            <div>
              <Label htmlFor="default_reminder_email_body">Default Reminder Email Body</Label>
              <Textarea
                id="default_reminder_email_body"
                value={formData.default_reminder_email_body}
                onChange={(e) => setFormData({ ...formData, default_reminder_email_body: e.target.value })}
                placeholder="Hi [Client Name],

This is a friendly reminder that invoice [Invoice Number] for [Project Name] is due on [Due Date].

Please let us know if you have any questions.

Thanks,
[Business Name]"
                rows={6}
              />
            </div>
          </div>
        </div>

        {/* Reminder Settings */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Reminder Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable_reminders"
                checked={formData.enable_reminders}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_reminders: checked })}
              />
              <Label htmlFor="enable_reminders">Enable Automatic Reminders</Label>
            </div>
            {formData.enable_reminders && (
              <div>
                <Label htmlFor="reminder_days_before_due">Send Reminder (days before due date)</Label>
                <Input
                  id="reminder_days_before_due"
                  type="number"
                  min="1"
                  value={formData.reminder_days_before_due}
                  onChange={(e) => setFormData({ ...formData, reminder_days_before_due: parseInt(e.target.value) || 7 })}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}