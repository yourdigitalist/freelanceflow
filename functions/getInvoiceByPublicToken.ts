import { createBase44Client } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize SDK without requiring authentication - this is a public endpoint
    const base44 = createBase44Client({
      appId: Deno.env.get('BASE44_APP_ID'),
    });
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    // Use service role to fetch invoice by public token
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ public_token: token });
    
    if (!invoices || invoices.length === 0) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Don't allow access to deleted or cancelled invoices
    if (invoice.status === 'cancelled') {
      return Response.json({ error: 'This invoice is no longer available' }, { status: 403 });
    }

    // Fetch only necessary data for the public image view
    const companyProfiles = await base44.asServiceRole.entities.CompanyProfile.filter({ created_by: invoice.created_by });

    const companyProfile = companyProfiles[0] || null;

    // Build minimal business info for the public image view
    const businessInfo = {
      business_name: companyProfile?.company_name || '',
      business_logo: companyProfile?.logo_url || '',
    };

    // Return minimal invoice data for public image view
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