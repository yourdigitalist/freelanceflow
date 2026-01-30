import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse request body - Base44 may wrap payload in different ways
    const body = await req.json().catch(() => ({}));
    const token = body?.token ?? body?.args?.token ?? body?.body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json({
        error: 'Token is required',
        debug: { bodyKeys: Object.keys(body || {}), rawBody: JSON.stringify(body).slice(0, 200) },
      }, { status: 400 });
    }

    // Normalize - filter() might return array or { data/items }
    const toArray = (r) => Array.isArray(r) ? r : (r?.data ?? r?.items ?? r?.records ?? []);

    // Exact match first
    let invoices = await base44.asServiceRole.entities.Invoice.filter({ public_token: token });
    let invoiceList = toArray(invoices);

    // Fallbacks for truncated tokens (old format uuid-timestamp was ~50 chars, DB may limit to 40)
    let listCount = 0;
    let listError = null;
    if (invoiceList.length === 0 && token.includes('-')) {
      try {
        const listResult = await base44.asServiceRole.entities.Invoice.list();
        const allInvoices = toArray(listResult);
        listCount = allInvoices.length;
        // Match: stored token is prefix of requested token, OR stored token matches UUID part
        const uuidPart = token.split('-').slice(0, 5).join('-'); // standard UUID format
        invoiceList = allInvoices.filter((inv) => {
          const st = String(inv?.public_token || '');
          return st && (token.startsWith(st) || st.startsWith(uuidPart) || st === uuidPart);
        });
      } catch (e) {
        listError = e?.message || String(e);
      }
    }

    if (!invoiceList || invoiceList.length === 0) {
      // Debug info to diagnose why invoice isn't found
      return Response.json({
        error: 'Invoice not found',
        debug: {
          tokenReceived: token,
          filterCount: toArray(invoices).length,
          listCount,
          listError,
          bodyKeys: Object.keys(body || {}),
        },
      }, { status: 404 });
    }

    invoices = invoiceList;

    const invoice = invoices[0];

    // Don't allow access to deleted or cancelled invoices
    if (invoice.status === 'cancelled') {
      return Response.json({ error: 'This invoice is no longer available' }, { status: 403 });
    }

    // Fetch company profile and invoice settings for business info
    const [companyProfilesRaw, invoiceSettingsRaw] = await Promise.all([
      base44.asServiceRole.entities.CompanyProfile.filter({ created_by: invoice.created_by }),
      base44.asServiceRole.entities.InvoiceSettings.filter({ created_by: invoice.created_by }),
    ]);

    const companyProfiles = toArray(companyProfilesRaw);
    const invoiceSettingsList = toArray(invoiceSettingsRaw);
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