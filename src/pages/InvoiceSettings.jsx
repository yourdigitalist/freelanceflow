import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Upload, Loader2 } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import { toast } from 'sonner';

export default function InvoiceSettings() {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const queryClient = useQueryClient();

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
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

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
        {/* Business Details */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Your Business Name"
              />
            </div>

            <div>
              <Label htmlFor="business_logo">Business Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.business_logo && (
                  <img
                    src={formData.business_logo}
                    alt="Business logo"
                    className="h-16 w-16 object-contain border border-slate-200 rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="cursor-pointer"
                  />
                </div>
                {uploadingLogo && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
              </div>
            </div>

            <div>
              <Label htmlFor="business_address">Business Address</Label>
              <Textarea
                id="business_address"
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                placeholder="123 Main St, Suite 100&#10;City, State ZIP"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_email">Business Email</Label>
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  placeholder="contact@business.com"
                />
              </div>
              <div>
                <Label htmlFor="business_phone">Business Phone</Label>
                <Input
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
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