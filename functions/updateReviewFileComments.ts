import { createBase44Client } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Initialize SDK without requiring authentication - this is a public endpoint
    const base44 = createBase44Client({
      appId: Deno.env.get('BASE44_APP_ID'),
    });
    
    const { reviewId, operation, comment, commentId } = await req.json();

    if (!reviewId || !operation) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current review
    const reviews = await base44.asServiceRole.entities.ReviewRequest.filter({ id: reviewId });
    if (!reviews || reviews.length === 0) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviews[0];
    let fileComments = review.file_comments || [];

    // Handle different operations
    if (operation === 'add') {
      if (!comment) {
        return Response.json({ error: 'Comment is required for add operation' }, { status: 400 });
      }
      fileComments.push({
        ...comment,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
    } else if (operation === 'edit') {
      if (!commentId || !comment) {
        return Response.json({ error: 'Comment ID and comment are required for edit operation' }, { status: 400 });
      }
      fileComments = fileComments.map(c => 
        c.id === commentId ? { ...c, text: comment.text } : c
      );
    } else if (operation === 'delete') {
      if (!commentId) {
        return Response.json({ error: 'Comment ID is required for delete operation' }, { status: 400 });
      }
      fileComments = fileComments.filter(c => c.id !== commentId);
    }

    await base44.asServiceRole.entities.ReviewRequest.update(reviewId, {
      file_comments: fileComments,
      status: fileComments.length > 0 ? 'commented' : review.status,
    });

    return Response.json({ success: true, file_comments: fileComments });
  } catch (error) {
    console.error('updateReviewFileComments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});