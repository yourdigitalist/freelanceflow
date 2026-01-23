import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = await req.json();

    if (!reviewId) {
      return Response.json({ error: 'Review ID required' }, { status: 400 });
    }

    // Fetch review details
    const review = await base44.entities.ReviewRequest.get(reviewId);
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    // Fetch client details
    const client = await base44.entities.Client.get(review.client_id);
    if (!client || !client.email) {
      return Response.json({ error: 'Client email not found' }, { status: 404 });
    }

    const appUrl = req.headers.get('origin') || 'https://app.flowdesk.com';
    const reviewLink = `${appUrl}/#/PublicReviewView?token=${review.share_token}`;
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Review Reminder</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Hi ${client.first_name},
          </p>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            This is a friendly reminder that you have a pending review request for <strong>${review.title}</strong>.
          </p>
          ${review.due_date ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>Due Date:</strong> ${new Date(review.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          ` : ''}
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">
            Please review the document and provide your feedback when you have a chance.
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${reviewLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Review Now
            </a>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              You can approve, reject, or add comments to the document directly in the review interface.
            </p>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      to: client.email,
      subject: `Reminder: Review Request - ${review.title}`,
      body: emailBody,
      from_name: 'Review Reminder'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});