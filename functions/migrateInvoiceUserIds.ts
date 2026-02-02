import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all invoices using service role
    const invoices = await base44.asServiceRole.entities.Invoice.list();

    let updated = 0;
    let errors = [];

    for (const invoice of invoices) {
      // Skip if user_id is already set correctly
      if (invoice.user_id && invoice.user_id !== '{{created_by_id}}') {
        continue;
      }

      // Update with created_by_id
      try {
        await base44.asServiceRole.entities.Invoice.update(invoice.id, {
          user_id: invoice.created_by_id
        });
        updated++;
      } catch (error) {
        errors.push({ invoice_id: invoice.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      total_invoices: invoices.length,
      updated_count: updated,
      errors: errors
    });
  } catch (error) {
    console.error('Error migrating invoice user_ids:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});