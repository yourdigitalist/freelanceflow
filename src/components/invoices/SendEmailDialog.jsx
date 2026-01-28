import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function SendEmailDialog({
  open,
  onOpenChange,
  invoice,
  client,
  initialSubject,
  initialBody,
  emailType = 'invoice'
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const [mergeTags] = useState([
    { tag: '{{client_first_name}}', label: 'Client First Name' },
    { tag: '{{client_last_name}}', label: 'Client Last Name' },
    { tag: '{{invoice_number}}', label: 'Invoice Number' },
    { tag: '{{invoice_total}}', label: 'Invoice Total' },
    { tag: '{{due_date}}', label: 'Due Date' },
  ]);

  useEffect(() => {
    if (open && initialSubject && initialBody) {
      setSubject(initialSubject || '');
      setBody(initialBody || '');
    }
  }, [open, initialSubject, initialBody]);

  const insertMergeTag = (tag) => {
    setBody(body + tag);
  };

  const handleSendEmail = async () => {
    if (!client?.email) {
      toast.error('Client email is missing');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body cannot be empty');
      return;
    }

    setSending(true);
    try {
      // Generate styled HTML email with invoice link
      const invoiceViewUrl = invoice.public_url || `${window.location.origin}/#/PublicInvoice?token=${invoice.public_token}`;
      
      const settings = await base44.entities.InvoiceSettings.list().then(list => list[0]);
      const businessName = settings?.business_name || 'Your Business';

      // Replace merge tags
      let processedBody = body
        .replace(/\{\{client_first_name\}\}/g, client.first_name || '')
        .replace(/\{\{client_last_name\}\}/g, client.last_name || '')
        .replace(/\{\{invoice_number\}\}/g, invoice.invoice_number || '')
        .replace(/\{\{invoice_total\}\}/g, `$${(invoice.total || 0).toFixed(2)}`)
        .replace(/\{\{due_date\}\}/g, invoice.due_date || '');
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header with logo/brand -->
                  <tr>
                    <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                      ${settings?.business_logo ? `<img src="${settings.business_logo}" alt="${businessName}" style="max-width: 150px; height: auto; margin-bottom: 10px;">` : ''}
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${businessName}</h1>
                    </td>
                  </tr>
                  
                  <!-- Invoice details -->
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice</p>
                      <h2 style="margin: 0 0 10px; color: #111827; font-size: 20px;">${invoice.invoice_number}</h2>
                      <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px;">Due ${invoice.due_date}</p>
                      
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total Amount</p>
                        <p style="margin: 0; color: #111827; font-size: 36px; font-weight: bold;">$${invoice.total.toFixed(2)}</p>
                      </div>
                      
                      <div style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                        ${processedBody.split('\n').map(line => `<p style="margin: 0 0 10px;">${line}</p>`).join('')}
                      </div>
                      
                      <a href="${invoiceViewUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                        View Invoice
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">${businessName}</p>
                      ${settings?.business_address ? `<p style="margin: 0 0 5px; color: #9ca3af; font-size: 12px;">${settings.business_address.replace(/\n/g, ', ')}</p>` : ''}
                      ${settings?.business_email ? `<p style="margin: 0 0 5px; color: #9ca3af; font-size: 12px;">${settings.business_email}</p>` : ''}
                      ${settings?.business_phone ? `<p style="margin: 0; color: #9ca3af; font-size: 12px;">${settings.business_phone}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: subject,
        body: htmlBody,
      });

      // Update invoice status to 'sent' when sending invoice email
      if (emailType === 'invoice') {
        await base44.entities.Invoice.update(invoice.id, { status: 'sent' });
      }

      // Track reminder sent
      if (emailType === 'reminder') {
        await base44.entities.Invoice.update(invoice.id, {
          last_reminder_sent: new Date().toISOString(),
          reminder_count: (invoice.reminder_count || 0) + 1
        });
      }

      toast.success(`Email sent to ${client.email}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to send email');
      console.error('Email send error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{emailType === 'invoice' ? 'Send Invoice' : 'Send Reminder'}</DialogTitle>
          <DialogDescription>
            Send this {emailType === 'invoice' ? 'invoice' : 'reminder'} to {client?.name} ({client?.email})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to" className="text-right">To</Label>
            <Input
              id="to"
              value={client?.email || ''}
              readOnly
              className="col-span-3 bg-slate-50"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="body" className="text-right">Body</Label>
            <div className="col-span-3 space-y-2">
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {mergeTags.map(({ tag, label }) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertMergeTag(tag)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={sending}>
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}