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
    let project = null;
    if (invoice.project_id) {
      project = await base44.entities.Project.get(invoice.project_id);
    }
    
    // Fetch company profile and settings for business info
    const companyProfiles = await base44.asServiceRole.entities.CompanyProfile.filter({ user_id: invoice.user_id });
    const company = companyProfiles[0] || {};
    
    const invoiceSettings = await base44.asServiceRole.entities.InvoiceSettings.filter({ created_by: user.email }).then(list => list[0]);
    
    // Build business info
    const businessInfo = {
      business_name: company.company_name || invoiceSettings?.business_name || '',
      business_logo: company.logo_url || invoiceSettings?.business_logo || '',
      business_address: company.street || company.city ? [
        company.street,
        company.street2,
        [company.city, company.state, company.zip].filter(Boolean).join(', '),
        company.country
      ].filter(Boolean).join('\n') : (invoiceSettings?.business_address || ''),
      business_email: company.email || invoiceSettings?.business_email || '',
      business_phone: company.phone ? (company.phone_country_code ? `${company.phone_country_code} ${company.phone}` : company.phone) : (invoiceSettings?.business_phone || ''),
    };
    
    // Get currency symbol
    const currencySymbol = company.currency === 'EUR' ? '€' : 
                           company.currency === 'GBP' ? '£' : 
                           company.currency === 'CAD' ? 'CA$' : 
                           company.currency === 'AUD' ? 'A$' : '$';

    // Create PDF
    const doc = new jsPDF();

    // Header - Business Name/Logo
    let yPos = 20;
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    if (businessInfo.business_name) {
      doc.text(businessInfo.business_name, 20, yPos);
    }
    yPos += 8;
    
    // Business address and contact
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    if (businessInfo.business_address) {
      const addressLines = businessInfo.business_address.split('\n');
      addressLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
    }
    if (businessInfo.business_email || businessInfo.business_phone) {
      const contact = [businessInfo.business_email, businessInfo.business_phone].filter(Boolean).join(' | ');
      doc.text(contact, 20, yPos);
      yPos += 5;
    }

    // Invoice title and info (right side)
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 200, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.invoice_number, 200, 28, { align: 'right' });
    doc.text(invoice.status.toUpperCase(), 200, 35, { align: 'right' });

    // Bill To section
    yPos = Math.max(yPos, 50);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To', 20, yPos);
    doc.text('Issue Date', 120, yPos);
    
    yPos += 6;
    doc.setFont(undefined, 'normal');
    
    // Client info
    const clientName = [client.first_name, client.last_name].filter(Boolean).join(' ') || client.company;
    doc.setFont(undefined, 'bold');
    doc.text(clientName, 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.issue_date || '', 120, yPos);
    yPos += 5;

    if (client.company && client.first_name) {
      doc.text(client.company, 20, yPos);
      yPos += 5;
    }
    if (client.email) {
      doc.text(client.email, 20, yPos);
      yPos += 5;
    }
    
    // Client address
    const addressParts = [
      client.street,
      client.street2,
      [client.city, client.state, client.zip].filter(Boolean).join(', '),
      client.country
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      doc.text(addressParts.join(', '), 20, yPos, { maxWidth: 90 });
      yPos += 5 * Math.ceil(addressParts.join(', ').length / 50);
    }
    
    // Due Date
    doc.text('Due Date', 120, 50 + 6);
    doc.text(invoice.due_date || '', 120, 50 + 11);
    
    // Project info if exists
    if (project) {
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Project', 20, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');
      doc.text(project.name, 20, yPos);
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
    if (invoice.notes || invoice.payment_terms || invoiceSettings?.invoice_footer) {
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      if (invoice.notes) {
        doc.setFont(undefined, 'bold');
        doc.text('Notes', 20, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
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
        doc.setFont(undefined, 'bold');
        doc.text('Payment Terms', 20, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        const termsLines = doc.splitTextToSize(invoice.payment_terms, 170);
        termsLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
      
      if (invoiceSettings?.invoice_footer) {
        yPos += 5;
        doc.setFontSize(8);
        const footerLines = doc.splitTextToSize(invoiceSettings.invoice_footer, 170);
        footerLines.forEach(line => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 105, yPos, { align: 'center' });
          yPos += 4;
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