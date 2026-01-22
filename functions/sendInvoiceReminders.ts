import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get settings
    const settingsList = await base44.asServiceRole.entities.InvoiceSettings.list();
    const settings = settingsList[0];
    
    if (!settings?.enable_reminders) {
      return Response.json({ 
        message: 'Reminders are disabled',
        sent: 0 
      });
    }

    const reminderDays = settings.reminder_days_before_due || 7;
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + reminderDays);
    const reminderDateStr = reminderDate.toISOString().split('T')[0];

    // Get all sent invoices with due date matching reminder date
    const invoices = await base44.asServiceRole.entities.Invoice.filter({
      status: 'sent',
      due_date: reminderDateStr
    });

    let sentCount = 0;

    for (const invoice of invoices) {
      // Get client
      const clients = await base44.asServiceRole.entities.Client.filter({ id: invoice.client_id });
      const client = clients[0];
      
      if (!client?.email) continue;

      // Get project if available
      let project = null;
      if (invoice.project_id) {
        const projects = await base44.asServiceRole.entities.Project.filter({ id: invoice.project_id });
        project = projects[0];
      }

      // Replace placeholders in email template
      const replacePlaceholders = (template) => {
        if (!template) return '';
        let text = template;
        text = text.replace(/\[Client Name\]/g, client.name || 'Client');
        text = text.replace(/\[Invoice Number\]/g, invoice.invoice_number || '');
        text = text.replace(/\[Project Name\]/g, project?.name || 'the project');
        text = text.replace(/\[Due Date\]/g, invoice.due_date || '');
        text = text.replace(/\[Business Name\]/g, settings.business_name || 'Your Business');
        return text;
      };

      const subject = settings.default_reminder_email_subject
        ? replacePlaceholders(settings.default_reminder_email_subject)
        : `Reminder: Invoice ${invoice.invoice_number} Due Soon`;

      const body = settings.default_reminder_email_body
        ? replacePlaceholders(settings.default_reminder_email_body)
        : `Hi ${client.name},\n\nThis is a friendly reminder that invoice ${invoice.invoice_number} is due on ${invoice.due_date}.\n\nPlease let us know if you have any questions.\n\nThanks,\n${settings.business_name || 'Your Business'}`;

      // Send email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.email,
        subject: subject,
        body: body,
      });

      sentCount++;
    }

    return Response.json({ 
      message: `Sent ${sentCount} reminder emails`,
      sent: sentCount 
    });
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});