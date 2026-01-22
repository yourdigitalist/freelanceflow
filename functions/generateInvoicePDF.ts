import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id } = await req.json();

    // Fetch invoice data
    const invoice = await base44.entities.Invoice.get(invoice_id);
    const client = await base44.entities.Client.get(invoice.client_id);
    
    // Fetch invoice settings for business info
    const settingsList = await base44.entities.InvoiceSettings.list();
    const settings = settingsList[0] || {};

    // Create PDF
    const doc = new jsPDF();

    // Business Logo/Name
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(settings.business_name || 'Your Business', 20, 25);

    // Invoice title
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice: ${invoice.invoice_number}`, 20, 35);
    doc.text(`Issue Date: ${invoice.issue_date}`, 20, 42);
    doc.text(`Due Date: ${invoice.due_date}`, 20, 49);

    // Business info
    let yPos = 60;
    doc.setFontSize(10);
    doc.text('From:', 20, yPos);
    yPos += 7;
    if (settings.business_name) {
      doc.text(settings.business_name, 20, yPos);
      yPos += 5;
    }
    if (settings.business_address) {
      const addressLines = settings.business_address.split('\n');
      addressLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
    }
    if (settings.business_email) {
      doc.text(settings.business_email, 20, yPos);
      yPos += 5;
    }
    if (settings.business_phone) {
      doc.text(settings.business_phone, 20, yPos);
      yPos += 5;
    }

    // Client info
    yPos = 60;
    doc.text('To:', 120, yPos);
    yPos += 7;
    const clientName = [client.first_name, client.last_name].filter(Boolean).join(' ') || client.company;
    doc.text(clientName, 120, yPos);
    yPos += 5;
    if (client.company && client.first_name) {
      doc.text(client.company, 120, yPos);
      yPos += 5;
    }
    if (client.street) {
      doc.text(client.street, 120, yPos);
      yPos += 5;
    }
    if (client.street2) {
      doc.text(client.street2, 120, yPos);
      yPos += 5;
    }
    const cityLine = [client.city, client.state, client.zip].filter(Boolean).join(', ');
    if (cityLine) {
      doc.text(cityLine, 120, yPos);
      yPos += 5;
    }
    if (client.country) {
      doc.text(client.country, 120, yPos);
      yPos += 5;
    }
    if (client.tax_id) {
      doc.text(`Tax ID: ${client.tax_id}`, 120, yPos);
      yPos += 5;
    }

    // Line items table
    yPos = Math.max(yPos, 120);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Description', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Rate', 145, yPos);
    doc.text('Amount', 175, yPos, { align: 'right' });
    
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    invoice.line_items.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const desc = item.description.length > 45 ? item.description.substring(0, 42) + '...' : item.description;
      doc.text(desc, 20, yPos);
      doc.text(String(item.quantity), 120, yPos);
      doc.text(`$${item.rate.toFixed(2)}`, 145, yPos);
      doc.text(`$${item.amount.toFixed(2)}`, 175, yPos, { align: 'right' });
      yPos += 7;
    });

    // Totals
    yPos += 5;
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', 145, yPos);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 175, yPos, { align: 'right' });
    
    yPos += 7;
    doc.text(`Tax (${invoice.tax_rate}%):`, 145, yPos);
    doc.text(`$${invoice.tax_amount.toFixed(2)}`, 175, yPos, { align: 'right' });
    
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 145, yPos);
    doc.text(`$${invoice.total.toFixed(2)}`, 175, yPos, { align: 'right' });

    // Notes & Payment Terms
    if (invoice.notes || invoice.payment_terms) {
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      if (invoice.notes) {
        doc.text('Notes:', 20, yPos);
        yPos += 7;
        const noteLines = doc.splitTextToSize(invoice.notes, 170);
        noteLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
      
      if (invoice.payment_terms) {
        doc.text('Payment Terms:', 20, yPos);
        yPos += 7;
        const termsLines = doc.splitTextToSize(invoice.payment_terms, 170);
        termsLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
      }
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoice.invoice_number}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});