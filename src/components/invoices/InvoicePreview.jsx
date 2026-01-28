import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SendEmailDialog from './SendEmailDialog';

const statusColors = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function InvoicePreview({ open, onOpenChange, invoice, client, project }) {
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [emailType, setEmailType] = useState('invoice');
  
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

  const { data: invoiceSettings } = useQuery({
    queryKey: ['invoiceSettings'],
    queryFn: async () => {
      const list = await base44.entities.InvoiceSettings.list();
      return list[0] || null;
    },
  });

  const businessInfo = {
    business_name: companyProfile?.company_name || '',
    business_logo: companyProfile?.logo_url || '',
    business_address: [
      companyProfile?.street,
      companyProfile?.street2,
      [companyProfile?.city, companyProfile?.state, companyProfile?.zip].filter(Boolean).join(', '),
      companyProfile?.country
    ].filter(Boolean).join('\n'),
    business_email: companyProfile?.email || '',
    business_phone: companyProfile?.phone ? 
      (companyProfile.phone_country_code ? `${companyProfile.phone_country_code} ${companyProfile.phone}` : companyProfile.phone) : '',
  };

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const replacePlaceholders = (template, currentInvoice, currentClient, currentProject, currentSettings) => {
    if (!template) return '';
    let text = template;
    const clientName = [currentClient?.first_name, currentClient?.last_name].filter(Boolean).join(' ') || currentClient?.company || 'Client';
    text = text.replace(/\[Client Name\]/g, clientName);
    text = text.replace(/\[Invoice Number\]/g, currentInvoice?.invoice_number || '');
    text = text.replace(/\[Project Name\]/g, currentProject?.name || 'the project');
    text = text.replace(/\[Due Date\]/g, currentInvoice?.due_date ? format(parseISO(currentInvoice.due_date), 'MMMM d, yyyy') : '');
    text = text.replace(/\[Business Name\]/g, currentSettings?.business_name || businessInfo?.business_name || 'Your Business');
    return text;
  };

  const handleSendInvoice = () => {
    setEmailType('invoice');
    setSendEmailDialogOpen(true);
  };

  const handleSendReminder = () => {
    setEmailType('reminder');
    setSendEmailDialogOpen(true);
  };

  const getEmailSubject = () => {
    if (emailType === 'reminder') {
      return invoiceSettings?.default_reminder_email_subject 
        ? replacePlaceholders(invoiceSettings.default_reminder_email_subject, invoice, client, project, invoiceSettings)
        : `Reminder: Invoice ${invoice?.invoice_number} Due Soon`;
    }
    return invoiceSettings?.default_invoice_email_subject 
      ? replacePlaceholders(invoiceSettings.default_invoice_email_subject, invoice, client, project, invoiceSettings)
      : `Invoice ${invoice?.invoice_number} from ${invoiceSettings?.business_name || 'Your Business'}`;
  };

  const getEmailBody = () => {
    const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || client?.company || 'Client';
    if (emailType === 'reminder') {
      return invoiceSettings?.default_reminder_email_body
        ? replacePlaceholders(invoiceSettings.default_reminder_email_body, invoice, client, project, invoiceSettings)
        : `Hi ${clientName},\n\nThis is a friendly reminder that invoice ${invoice?.invoice_number} for ${project?.name || 'the project'} is due on ${invoice?.due_date ? format(parseISO(invoice.due_date), 'MMMM d, yyyy') : ''}.`;
    }
    return invoiceSettings?.default_invoice_email_body
      ? replacePlaceholders(invoiceSettings.default_invoice_email_body, invoice, client, project, invoiceSettings)
      : `Hi ${clientName},\n\nHere is your invoice for ${project?.name || 'the project'}.\n\nPlease let us know if you have any questions.\n\nThanks,\n${invoiceSettings?.business_name || businessInfo?.business_name || 'Your Business'}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              {client?.email && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSendInvoice}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invoice
                  </Button>
                  {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                    <div className="relative group">
                      <Button variant="outline" size="sm" onClick={handleSendReminder}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Reminder
                      </Button>
                      {invoice.last_reminder_sent && (
                        <div className="absolute hidden group-hover:block top-full mt-1 right-0 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Last sent: {new Date(invoice.last_reminder_sent).toLocaleDateString()}
                          {invoice.reminder_count > 0 && ` (${invoice.reminder_count} total)`}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 p-8 bg-white border border-slate-200 rounded-xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {businessInfo.business_logo && (
                <img 
                  src={businessInfo.business_logo} 
                  alt="Business logo" 
                  className="h-12 mb-3 object-contain"
                />
              )}
              {businessInfo.business_name && (
                <h2 className="text-lg font-semibold text-slate-900 mb-1">{businessInfo.business_name}</h2>
              )}
              {businessInfo.business_address && (
                <p className="text-sm text-slate-600 whitespace-pre-line mb-2">{businessInfo.business_address}</p>
              )}
              {(businessInfo.business_email || businessInfo.business_phone) && (
                <p className="text-sm text-slate-600">
                  {businessInfo.business_email}
                  {businessInfo.business_email && businessInfo.business_phone && ' | '}
                  {businessInfo.business_phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">INVOICE</h1>
              <p className="text-slate-500">{invoice.invoice_number}</p>
              <Badge className={cn("text-sm mt-2", statusColors[invoice.status])}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Dates and Client Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Bill To</h3>
              <p className="font-semibold text-slate-900">
                {[client?.first_name, client?.last_name].filter(Boolean).join(' ') || client?.company || 'Client'}
              </p>
              {client?.company && client?.first_name && <p className="text-slate-600">{client.company}</p>}
              <p className="text-slate-600">{client?.email}</p>
              {[client?.street, client?.city, client?.state, client?.zip, client?.country].filter(Boolean).length > 0 && (
                <p className="text-slate-600 mt-1">
                  {[client?.street, client?.street2, 
                    [client?.city, client?.state, client?.zip].filter(Boolean).join(', '),
                    client?.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="mb-3">
                <p className="text-sm text-slate-500">Issue Date</p>
                <p className="font-medium text-slate-900">
                  {invoice.issue_date ? format(parseISO(invoice.issue_date), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-medium text-slate-900">
                  {invoice.due_date ? format(parseISO(invoice.due_date), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
            </div>
          </div>

          {project && (
            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">Project</p>
              <p className="font-medium text-slate-900">{project.name}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  {invoice.show_item_column && (
                    <th className="text-left py-3 text-sm font-medium text-slate-500">Description</th>
                  )}
                  {invoice.show_quantity_column && (
                    <th className="text-right py-3 text-sm font-medium text-slate-500 w-20">Qty</th>
                  )}
                  {invoice.show_rate_column && (
                    <th className="text-right py-3 text-sm font-medium text-slate-500 w-24">Rate</th>
                  )}
                  <th className="text-right py-3 text-sm font-medium text-slate-500 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items?.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {invoice.show_item_column && (
                      <td className="py-3 text-slate-900">{item.description}</td>
                    )}
                    {invoice.show_quantity_column && (
                      <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                    )}
                    {invoice.show_rate_column && (
                      <td className="py-3 text-right text-slate-600">${item.rate?.toFixed(2)}</td>
                    )}
                    <td className="py-3 text-right font-medium text-slate-900">${item.amount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">${invoice.subtotal?.toFixed(2)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">{invoice.tax_name || 'Tax'} ({invoice.tax_rate}%)</span>
                  <span className="font-medium text-slate-900">${invoice.tax_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t border-slate-200 mt-2">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-xl text-emerald-600">${invoice.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Payment Terms */}
          {(invoice.notes || invoice.payment_terms || invoiceSettings?.invoice_footer) && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              {invoice.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Notes</h4>
                  <p className="text-slate-600 text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.payment_terms && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Payment Terms</h4>
                  <p className="text-slate-600 text-sm">{invoice.payment_terms}</p>
                </div>
              )}
              {invoiceSettings?.invoice_footer && (
                <div className="text-center pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">{invoiceSettings.invoice_footer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      <SendEmailDialog
        open={sendEmailDialogOpen}
        onOpenChange={setSendEmailDialogOpen}
        invoice={invoice}
        client={client}
        initialSubject={getEmailSubject()}
        initialBody={getEmailBody()}
        emailType={emailType}
      />
    </Dialog>
  );
}