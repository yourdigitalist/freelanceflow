import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_id, return_url = false } = await req.json();

    // Fetch invoice data
    const invoice = await base44.entities.Invoice.get(invoice_id);
    const client = await base44.entities.Client.get(invoice.client_id);
    
    // Fetch company profile and settings for business info
    const companyProfiles = await base44.asServiceRole.entities.CompanyProfile.filter({ user_id: user.id });
    const company = companyProfiles[0] || {};
    
    const settings = await base44.asServiceRole.entities.InvoiceSettings.list().then(list => list[0]);
    
    // Get currency symbol
    const currencySymbol = company.currency === 'EUR' ? '€' : 
                           company.currency === 'GBP' ? '£' : 
                           company.currency === 'CAD' ? 'CA$' : 
                           company.currency === 'AUD' ? 'A$' : '$';

    // Create PDF
    const doc = new jsPDF();

    // Business Logo/Name
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(company.company_name || 'Your Business', 20, 25);

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
    if (company.company_name) {
      doc.text(company.company_name, 20, yPos);
      yPos += 5;
    }
    if (company.street) {
      doc.text(company.street, 20, yPos);
      yPos += 5;
    }
    if (company.street2) {
      doc.text(company.street2, 20, yPos);
      yPos += 5;
    }
    const companyCity = [company.city, company.state, company.zip].filter(Boolean).join(', ');
    if (companyCity) {
      doc.text(companyCity, 20, yPos);
      yPos += 5;
    }
    if (company.country) {
      doc.text(company.country, 20, yPos);
      yPos += 5;
    }
    if (company.email) {
      doc.text(company.email, 20, yPos);
      yPos += 5;
    }
    if (company.phone) {
      const phone = company.phone_country_code ? `${company.phone_country_code} ${company.phone}` : company.phone;
      doc.text(phone, 20, yPos);
      yPos += 5;
    }
    if (company.tax_id) {
      doc.text(`Tax ID: ${company.tax_id}`, 20, yPos);
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

    // Line items table with column visibility
    yPos = Math.max(yPos, 120);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    
    // Determine column positions based on visibility
    let colPositions = { desc: 20 };
    let currentX = 20;
    
    if (invoice.show_item_column !== false) {
      doc.text('Description', colPositions.desc, yPos);
      currentX = 100;
    }
    
    if (invoice.show_quantity_column !== false) {
      colPositions.qty = currentX;
      doc.text('Qty', colPositions.qty, yPos);
      currentX += 25;
    }
    
    if (invoice.show_rate_column !== false) {
      colPositions.rate = currentX;
      doc.text('Rate', colPositions.rate, yPos);
      currentX += 30;
    }
    
    colPositions.amount = 175;
    doc.text('Amount', colPositions.amount, yPos, { align: 'right' });
    
    yPos += 7;
    doc.setFont(undefined, 'normal');
    
    invoice.line_items.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      if (invoice.show_item_column !== false) {
        const desc = item.description.length > 45 ? item.description.substring(0, 42) + '...' : item.description;
        doc.text(desc, colPositions.desc, yPos);
      }
      
      if (invoice.show_quantity_column !== false && colPositions.qty) {
        doc.text(String(item.quantity), colPositions.qty, yPos);
      }
      
      if (invoice.show_rate_column !== false && colPositions.rate) {
        doc.text(`${currencySymbol}${item.rate.toFixed(2)}`, colPositions.rate, yPos);
      }
      
      doc.text(`${currencySymbol}${item.amount.toFixed(2)}`, colPositions.amount, yPos, { align: 'right' });
      yPos += 7;
    });

    // Totals
    yPos += 5;
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', 145, yPos);
    doc.text(`${currencySymbol}${invoice.subtotal.toFixed(2)}`, 175, yPos, { align: 'right' });
    
    if (invoice.tax_rate > 0) {
      yPos += 7;
      const taxLabel = invoice.tax_name ? `${invoice.tax_name} (${invoice.tax_rate}%):` : `Tax (${invoice.tax_rate}%):`;
      doc.text(taxLabel, 145, yPos);
      doc.text(`${currencySymbol}${invoice.tax_amount.toFixed(2)}`, 175, yPos, { align: 'right' });
    }
    
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 145, yPos);
    doc.text(`${currencySymbol}${invoice.total.toFixed(2)}`, 175, yPos, { align: 'right' });

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

    // If return_url is true, save to storage and return URL
    if (return_url) {
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], `invoice-${invoice.invoice_number}.pdf`, { type: 'application/pdf' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      
      return Response.json({ file_url });
    }

    // Otherwise return PDF to open in browser
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=invoice-${invoice.invoice_number}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});