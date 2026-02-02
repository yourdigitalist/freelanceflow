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
  const [cc, setCc] = useState('');
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
      setCc('');
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
      // Replace merge tags
      let processedBody = body
        .replace(/\{\{client_first_name\}\}/g, client.first_name || '')
        .replace(/\{\{client_last_name\}\}/g, client.last_name || '')
        .replace(/\{\{invoice_number\}\}/g, invoice.invoice_number || '')
        .replace(/\{\{invoice_total\}\}/g, `${invoice.total || 0}`)
        .replace(/\{\{due_date\}\}/g, invoice.due_date || '');

      const ccEmails = cc.trim() ? cc.split(',').map(email => email.trim()).filter(Boolean) : [];

      // Send via backend function with PDF attachment
      await base44.functions.invoke('sendInvoiceEmail', {
        invoice_id: invoice.id,
        client_email: client.email,
        subject: subject,
        body: processedBody,
        cc_emails: ccEmails,
        email_type: emailType
      });

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
            <Label htmlFor="cc" className="text-right">CC</Label>
            <Input
              id="cc"
              placeholder="email1@example.com, email2@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="col-span-3"
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