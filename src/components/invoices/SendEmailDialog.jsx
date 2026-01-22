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

  useEffect(() => {
    if (open) {
      setSubject(initialSubject || '');
      setBody(initialBody || '');
    }
  }, [open, initialSubject, initialBody]);

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
      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: subject,
        body: body,
      });

      // Update invoice status to 'sent' if it's currently 'draft'
      if (invoice.status === 'draft' && emailType === 'invoice') {
        await base44.entities.Invoice.update(invoice.id, { status: 'sent' });
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
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="col-span-3 resize-none"
            />
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