import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize SDK without requiring authentication - this is a public endpoint
    const base44 = createClientFromRequest(req);
    
    const { reviewId, status } = await req.json();

    if (!reviewId || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.entities.ReviewRequest.update(reviewId, {
      status,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('updateReviewStatus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});