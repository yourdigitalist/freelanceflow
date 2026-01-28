import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Upload, Loader2, Plus, Trash2, Edit, ExternalLink, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from '../components/shared/PageHeader';
import { toast } from 'sonner';

export default function InvoiceSettings() {
  const navigate = useNavigate();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [taxFormData, setTaxFormData] = useState({ name: '', rate: 0 });
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
    queryKey: ['invoiceSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const list = await base44.entities.InvoiceSettings.filter({ created_by: user.email });
      return list[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: taxRates = [] } = useQuery({
    queryKey: ['taxRates', user?.email],
    queryFn: () => base44.entities.TaxRate.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    invoice_footer: '',
    default_payment_terms: 'Payment due within 30 days.',
    default_tax_rate_id: '',
    default_invoice_email_subject: 'Invoice [Invoice Number] from [Business Name]',
    default_invoice_email_body: 'Hi [Client Name],\n\nHere is your invoice for [Project Name]. Please let us know if you have any questions.\n\nThanks,\n[Business Name]',
    default_reminder_email_subject: 'Reminder: Invoice [Invoice Number] Due Soon',
    default_reminder_email_body: 'Hi [Client Name],\n\nThis is a friendly reminder that invoice [Invoice Number] for [Project Name] is due on [Due Date].\n\nPlease let us know if you have any questions.\n\nThanks,\n[Business Name]',
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

  const createTaxMutation = useMutation({
    mutationFn: (data) => base44.entities.TaxRate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
      setTaxDialogOpen(false);
      setEditingTax(null);
      setTaxFormData({ name: '', rate: 0 });
      toast.success('Tax rate saved');
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaxRate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
      setTaxDialogOpen(false);
      setEditingTax(null);
      setTaxFormData({ name: '', rate: 0 });
      toast.success('Tax rate updated');
    },
  });

  const deleteTaxMutation = useMutation({
    mutationFn: (id) => base44.entities.TaxRate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
      toast.success('Tax rate deleted');
    },
  });

  const handleTaxSubmit = (e) => {
    e.preventDefault();
    if (editingTax) {
      updateTaxMutation.mutate({ id: editingTax.id, data: taxFormData });
    } else {
      createTaxMutation.mutate(taxFormData);
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Business Information</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('CompanySettings'))}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Company Info
            </Button>
          </div>
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
              <Label htmlFor="default_tax_rate">Tax Rates</Label>
              <div className="space-y-3 mt-2">
                {taxRates.map((tax) => (
                  <div key={tax.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{tax.name}</p>
                      <p className="text-sm text-slate-600">{tax.rate}%</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTax(tax);
                          setTaxFormData({ name: tax.name, rate: tax.rate });
                          setTaxDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTaxMutation.mutate(tax.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTax(null);
                    setTaxFormData({ name: '', rate: 0 });
                    setTaxDialogOpen(true);
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tax Rate
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="default_tax">Default Tax</Label>
              <Select
                value={formData.default_tax_rate_id || ''}
                onValueChange={(value) => setFormData({ ...formData, default_tax_rate_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default tax" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Tax</SelectItem>
                  {taxRates.map((tax) => (
                    <SelectItem key={tax.id} value={tax.id}>
                      {tax.name} ({tax.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="default_invoice_email_body">Default Invoice Email Body</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Insert Placeholder
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_invoice_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_invoice_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_invoice_email_body: textBefore + '[Client Name]' + textAfter });
                    }}>
                      [Client Name]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_invoice_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_invoice_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_invoice_email_body: textBefore + '[Invoice Number]' + textAfter });
                    }}>
                      [Invoice Number]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_invoice_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_invoice_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_invoice_email_body: textBefore + '[Project Name]' + textAfter });
                    }}>
                      [Project Name]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_invoice_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_invoice_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_invoice_email_body: textBefore + '[Due Date]' + textAfter });
                    }}>
                      [Due Date]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_invoice_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_invoice_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_invoice_email_body: textBefore + '[Business Name]' + textAfter });
                    }}>
                      [Business Name]
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="default_invoice_email_body"
                value={formData.default_invoice_email_body}
                onChange={(e) => setFormData({ ...formData, default_invoice_email_body: e.target.value })}
                placeholder="Hi [Client Name],&#10;&#10;Here is your invoice for [Project Name]. Please let us know if you have any questions.&#10;&#10;Thanks,&#10;[Business Name]"
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="default_reminder_email_body">Default Reminder Email Body</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Insert Placeholder
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_reminder_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_reminder_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_reminder_email_body: textBefore + '[Client Name]' + textAfter });
                    }}>
                      [Client Name]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_reminder_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_reminder_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_reminder_email_body: textBefore + '[Invoice Number]' + textAfter });
                    }}>
                      [Invoice Number]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_reminder_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_reminder_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_reminder_email_body: textBefore + '[Project Name]' + textAfter });
                    }}>
                      [Project Name]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_reminder_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_reminder_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_reminder_email_body: textBefore + '[Due Date]' + textAfter });
                    }}>
                      [Due Date]
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const textarea = document.getElementById('default_reminder_email_body');
                      const cursorPos = textarea.selectionStart;
                      const currentText = formData.default_reminder_email_body || '';
                      const textBefore = currentText.substring(0, cursorPos);
                      const textAfter = currentText.substring(cursorPos);
                      setFormData({ ...formData, default_reminder_email_body: textBefore + '[Business Name]' + textAfter });
                    }}>
                      [Business Name]
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="default_reminder_email_body"
                value={formData.default_reminder_email_body}
                onChange={(e) => setFormData({ ...formData, default_reminder_email_body: e.target.value })}
                placeholder="Hi [Client Name],&#10;&#10;This is a friendly reminder that invoice [Invoice Number] for [Project Name] is due on [Due Date].&#10;&#10;Please let us know if you have any questions.&#10;&#10;Thanks,&#10;[Business Name]"
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

      {/* Tax Rate Dialog */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaxSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tax_name">Tax Name</Label>
              <Input
                id="tax_name"
                value={taxFormData.name}
                onChange={(e) => setTaxFormData({ ...taxFormData, name: e.target.value })}
                placeholder="e.g., VAT, GST, Sales Tax"
                required
              />
            </div>
            <div>
              <Label htmlFor="tax_rate">Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxFormData.rate}
                onChange={(e) => setTaxFormData({ ...taxFormData, rate: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTaxDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingTax ? 'Update' : 'Add'} Tax Rate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}