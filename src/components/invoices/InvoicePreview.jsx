import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SendEmailDialog from './SendEmailDialog';
import InvoiceRenderer from './InvoiceRenderer';

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

  const currencySymbol = companyProfile?.currency === 'EUR' ? '€' : 
                         companyProfile?.currency === 'GBP' ? '£' : 
                         companyProfile?.currency === 'CAD' ? 'CA$' : 
                         companyProfile?.currency === 'AUD' ? 'A$' : '$';

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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <div className="mt-4 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl">
          <div className="mx-auto shadow-lg rounded-lg overflow-hidden" style={{ maxWidth: '794px' }}>
            <InvoiceRenderer
              invoice={invoice}
              client={client}
              project={project}
              businessInfo={businessInfo}
              invoiceSettings={invoiceSettings}
              currencySymbol={currencySymbol}
            />
          </div>
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