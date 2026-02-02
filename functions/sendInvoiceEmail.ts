import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id, client_email, subject, body, cc_emails = [], email_type = 'invoice' } = await req.json();

    // Fetch invoice, client, and settings
    const invoice = await base44.entities.Invoice.get(invoice_id);
    const client = await base44.entities.Client.get(invoice.client_id);
    
    const companyProfiles = await base44.entities.CompanyProfile.filter({ user_id: user.id });
    const companyProfile = companyProfiles[0] || {};
    
    const settings = await base44.entities.InvoiceSettings.list().then(list => list[0]);
    const emailSettings = await base44.entities.EmailSettings.list().then(list => list[0]);
    
    const businessName = companyProfile?.company_name || settings?.business_name || 'Your Business';
    const logoUrl = emailSettings?.logo_url || companyProfile?.logo_url || settings?.business_logo || '';
    const headerColor = emailSettings?.header_color || '#9B63E9';
    const buttonColor = emailSettings?.button_color || '#9B63E9';
    const footerText = emailSettings?.footer_text || '';
    
    const currencySymbol = companyProfile?.currency === 'EUR' ? '€' : 
                           companyProfile?.currency === 'GBP' ? '£' : '$';
    
    const formattedPhone = companyProfile?.phone_country_code && companyProfile?.phone 
      ? `${companyProfile.phone_country_code} ${companyProfile.phone}` 
      : companyProfile?.phone || settings?.business_phone || '';

    // Generate PDF and get file URL
    const { file_url: pdfUrl } = await base44.functions.invoke('generateInvoicePDF', {
      invoice_id,
      return_url: true
    });

    // Build HTML email
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
                <tr>
                  <td style="padding: 40px; text-align: center; background: ${headerColor};">
                    ${logoUrl ? `<img src="${logoUrl}" alt="${businessName}" style="max-width: 150px; height: auto; margin-bottom: 10px;">` : ''}
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${businessName}</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice</p>
                    <h2 style="margin: 0 0 10px; color: #111827; font-size: 20px;">${invoice.invoice_number}</h2>
                    <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px;">Due ${invoice.due_date}</p>
                    
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                      <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total Amount</p>
                      <p style="margin: 0; color: #111827; font-size: 36px; font-weight: bold;">${currencySymbol}${invoice.total.toFixed(2)}</p>
                    </div>
                    
                    <div style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                      ${body.split('\n').map(line => `<p style="margin: 0 0 10px;">${line}</p>`).join('')}
                    </div>
                    
                    <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Please find your invoice attached as a PDF.</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">${businessName}</p>
                    ${companyProfile?.street ? `<p style="margin: 0 0 5px; color: #9ca3af; font-size: 12px;">${[companyProfile.street, companyProfile.street2, companyProfile.city, companyProfile.state, companyProfile.zip, companyProfile.country].filter(Boolean).join(', ')}</p>` : ''}
                    ${companyProfile?.email || settings?.business_email ? `<p style="margin: 0 0 5px; color: #9ca3af; font-size: 12px;">${companyProfile?.email || settings?.business_email}</p>` : ''}
                    ${formattedPhone ? `<p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">${formattedPhone}</p>` : ''}
                    ${footerText ? `<p style="margin: 0; color: #9ca3af; font-size: 11px;">${footerText}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send to primary recipient with PDF attachment
    await base44.integrations.Core.SendEmail({
      from_name: businessName,
      to: client_email,
      subject: subject,
      body: htmlBody,
      attachments: [pdfUrl]
    });

    // Send to CC recipients
    for (const ccEmail of cc_emails) {
      await base44.integrations.Core.SendEmail({
        from_name: businessName,
        to: ccEmail,
        subject: subject,
        body: htmlBody,
        attachments: [pdfUrl]
      });
    }

    // Update invoice status
    if (email_type === 'invoice') {
      await base44.entities.Invoice.update(invoice_id, { status: 'sent' });
    }

    if (email_type === 'reminder') {
      await base44.entities.Invoice.update(invoice_id, {
        last_reminder_sent: new Date().toISOString(),
        reminder_count: (invoice.reminder_count || 0) + 1
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});