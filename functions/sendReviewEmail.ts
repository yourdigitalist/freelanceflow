import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewTitle, recipients, shareToken, appUrl, password } = await req.json();

    if (!reviewTitle || !recipients || !shareToken || !appUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reviewLink = `${appUrl}/PublicReviewView?token=${shareToken}`;
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Document Review Request</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            You have been asked to review <strong>${reviewTitle}</strong>.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">
            Click the button below to view the document, add comments, and provide your feedback.
          </p>
          ${password ? `<div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin: 0;"><strong>🔒 Password:</strong> ${password}</p>
          </div>` : ''}
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${reviewLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Review Document
            </a>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              You can approve, reject, or add comments to the document directly in the review interface.
            </p>
          </div>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send emails to all recipients
    const emailPromises = recipients.map(email =>
      base44.integrations.Core.SendEmail({
        to: email,
        subject: `Review Request: ${reviewTitle}`,
        body: emailBody,
        from_name: 'Review Request'
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ success: true, emailsSent: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});