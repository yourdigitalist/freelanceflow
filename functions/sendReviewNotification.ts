import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { reviewId, type, commenterName, commenterEmail } = await req.json();

    if (!reviewId || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get review details
    const review = await base44.asServiceRole.entities.ReviewRequest.get(reviewId);
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    // Get the owner's email
    const ownerEmail = review.created_by;

    let subject = '';
    let body = '';

    if (type === 'comment') {
      subject = `New comment on "${review.title}"`;
      body = `
        <h2>New Comment Added</h2>
        <p><strong>${commenterName}</strong> (${commenterEmail}) added a comment to your review request:</p>
        <p><strong>Review:</strong> ${review.title}</p>
        <p>Log in to your dashboard to view the comment and respond.</p>
      `;
    } else if (type === 'approved') {
      subject = `"${review.title}" has been approved`;
      body = `
        <h2>Review Approved</h2>
        <p>Your review request "<strong>${review.title}</strong>" has been approved by ${commenterName}.</p>
      `;
    } else if (type === 'rejected') {
      subject = `"${review.title}" has been rejected`;
      body = `
        <h2>Review Rejected</h2>
        <p>Your review request "<strong>${review.title}</strong>" has been rejected by ${commenterName}.</p>
        <p>Please check the comments for feedback.</p>
      `;
    }

    // Send email to the review owner
    await base44.integrations.Core.SendEmail({
      to: ownerEmail,
      subject,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});