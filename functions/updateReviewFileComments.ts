import { createBase44Client } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize SDK without requiring authentication - this is a public endpoint
    const base44 = createBase44Client({
      appId: Deno.env.get('BASE44_APP_ID'),
    });
    
    const { reviewId, fileComments } = await req.json();

    if (!reviewId || !fileComments) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.entities.ReviewRequest.update(reviewId, {
      file_comments: fileComments,
      status: 'commented',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('updateReviewFileComments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});