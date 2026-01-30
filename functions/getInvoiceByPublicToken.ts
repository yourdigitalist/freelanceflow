import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Public endpoint - createClientFromRequest works for unauthenticated requests;
    // service role is automatically available in Base44-hosted functions
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    // Use service role to fetch invoice by public token
    let invoices = await base44.asServiceRole.entities.Invoice.filter({ public_token: token });
    
    // Fallback: if token was truncated in DB (old format was uuid-timestamp, ~50 chars),
    // try matching by prefix - find invoice where stored token is start of requested token
    if ((!invoices || invoices.length === 0) && token.includes('-')) {
      const allInvoices = await base44.asServiceRole.entities.Invoice.list();
      invoices = allInvoices.filter(
        (inv) => inv.public_token && token.startsWith(inv.public_token)
      );
    }
    
    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Don't allow access to deleted or cancelled invoices
    if (invoice.status === 'cancelled') {
      return Response.json({ error: 'This invoice is no longer available' }, { status: 403 });
    }

    // Fetch company profile and invoice settings for business info
    const [companyProfiles, invoiceSettingsList] = await Promise.all([
      base44.asServiceRole.entities.CompanyProfile.filter({ created_by: invoice.created_by }),
      base44.asServiceRole.entities.InvoiceSettings.filter({ created_by: invoice.created_by }),
    ]);

    const companyProfile = companyProfiles[0] || null;
    const invoiceSettings = invoiceSettingsList[0] || null;

    // Build full business info for the public invoice view
    const businessAddress = [
      companyProfile?.street,
      companyProfile?.street2,
      [companyProfile?.city, companyProfile?.state, companyProfile?.zip].filter(Boolean).join(', '),
      companyProfile?.country
    ].filter(Boolean).join('\n');

    const businessPhone = companyProfile?.phone
      ? (companyProfile.phone_country_code ? `${companyProfile.phone_country_code} ${companyProfile.phone}` : companyProfile.phone)
      : '';

    const businessInfo = {
      business_name: companyProfile?.company_name || invoiceSettings?.business_name || '',
      business_logo: companyProfile?.logo_url || invoiceSettings?.business_logo || '',
      business_address: businessAddress || '',
      business_email: companyProfile?.email || invoiceSettings?.business_email || '',
      business_phone: businessPhone || invoiceSettings?.business_phone || '',
      invoice_footer: invoiceSettings?.invoice_footer || '',
    };

    // Return invoice data for public view (PNG + company info)
    return Response.json({
      invoice: {
        invoice_number: invoice.invoice_number,
        public_image_url: invoice.public_image_url,
        status: invoice.status,
      },
      businessInfo,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});