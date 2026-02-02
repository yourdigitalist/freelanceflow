import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const token = body?.token ?? body?.args?.token ?? body?.body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json({
        error: 'Token is required',
      }, { status: 400 });
    }

    // Use asServiceRole to bypass RLS and fetch by public_token
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ public_token: token });
    
    if (!invoices || invoices.length === 0) {
      return Response.json({
        error: 'Invoice not found',
      }, { status: 404 });
    }

    const invoice = invoices[0];

    // Don't allow access to cancelled invoices
    if (invoice.status === 'cancelled') {
      return Response.json({ error: 'This invoice is no longer available' }, { status: 403 });
    }

    // Fetch client data
    const clients = await base44.asServiceRole.entities.Client.filter({ id: invoice.client_id });
    const client = clients[0] || null;

    // Fetch project data if exists
    let project = null;
    if (invoice.project_id) {
      const projects = await base44.asServiceRole.entities.Project.filter({ id: invoice.project_id });
      project = projects[0] || null;
    }

    // Fetch user details first to get email for InvoiceSettings
    const users = await base44.asServiceRole.entities.User.filter({ id: invoice.user_id });
    const invoiceUser = users[0] || null;

    // Fetch company profile and invoice settings for business info
    // CompanyProfile uses user_id, InvoiceSettings uses created_by (email)
    const companyProfiles = await base44.asServiceRole.entities.CompanyProfile.filter({ user_id: invoice.user_id });
    const invoiceSettings = invoiceUser 
      ? await base44.asServiceRole.entities.InvoiceSettings.filter({ created_by: invoiceUser.email })
      : [];
    
    const companyProfile = companyProfiles[0] || null;
    const invoiceSetting = invoiceSettings[0] || null;

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
      business_name: companyProfile?.company_name || invoiceSetting?.business_name || '',
      business_logo: companyProfile?.logo_url || invoiceSetting?.business_logo || '',
      business_address: businessAddress || '',
      business_email: companyProfile?.email || invoiceSetting?.business_email || '',
      business_phone: businessPhone || invoiceSetting?.business_phone || '',
      invoice_footer: invoiceSetting?.invoice_footer || '',
    };

    // Return full invoice data for public view
    return Response.json({
      invoice,
      client,
      project,
      businessInfo,
      currency: companyProfile?.currency || 'USD',
      numberFormat: '1,000.00',
    });
  } catch (error) {
    console.error('Error in getInvoiceByPublicToken:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});