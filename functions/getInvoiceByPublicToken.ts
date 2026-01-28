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

    // Fetch related data
    const [clients, projects, companyProfiles, invoiceSettings, personalPreferences] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ id: invoice.client_id }),
      invoice.project_id ? base44.asServiceRole.entities.Project.filter({ id: invoice.project_id }) : Promise.resolve([]),
      base44.asServiceRole.entities.CompanyProfile.filter({ user_id: invoice.created_by }),
      base44.asServiceRole.entities.InvoiceSettings.filter({ created_by: invoice.created_by }),
      base44.asServiceRole.entities.PersonalPreference.filter({ created_by: invoice.created_by })
    ]);

    const client = clients[0];
    const project = projects[0] || null;
    const companyProfile = companyProfiles[0] || null;
    const settings = invoiceSettings[0] || null;
    const preferences = personalPreferences[0] || null;

    // Build business info from company profile
    const businessInfo = {
      business_name: companyProfile?.company_name || '',
      business_logo: companyProfile?.logo_url || '',
      business_address: [companyProfile?.street, companyProfile?.street2, 
         [companyProfile?.city, companyProfile?.state, companyProfile?.zip].filter(Boolean).join(', '),
         companyProfile?.country].filter(Boolean).join('\n') || '',
      business_email: companyProfile?.email || '',
      business_phone: (companyProfile?.phone_country_code && companyProfile?.phone ? 
          `${companyProfile.phone_country_code} ${companyProfile.phone}` : companyProfile?.phone || ''),
      invoice_footer: settings?.invoice_footer || '',
    };

    // Return public invoice data
    return Response.json({
      invoice: {
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        line_items: invoice.line_items,
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_name: invoice.tax_name,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        notes: invoice.notes,
        payment_terms: invoice.payment_terms,
        status: invoice.status,
        show_item_column: invoice.show_item_column !== undefined ? invoice.show_item_column : true,
        show_quantity_column: invoice.show_quantity_column !== undefined ? invoice.show_quantity_column : true,
        show_rate_column: invoice.show_rate_column !== undefined ? invoice.show_rate_column : true,
      },
      client: client ? {
        first_name: client.first_name,
        last_name: client.last_name,
        company: client.company,
        email: client.email,
        street: client.street,
        street2: client.street2,
        city: client.city,
        state: client.state,
        zip: client.zip,
        country: client.country,
      } : null,
      project: project ? {
        name: project.name,
      } : null,
      businessInfo,
      numberFormat: preferences?.number_format || '1,000.00',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});