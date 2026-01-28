import { createBase44Client } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createBase44Client({
      appId: Deno.env.get('BASE44_APP_ID'),
    });
    
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    const reviews = await base44.asServiceRole.entities.ReviewRequest.filter({ 
      share_token: token 
    });
    
    if (!reviews || reviews.length === 0) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviews[0];

    const [clients, projects] = await Promise.all([
      review.client_id 
        ? base44.asServiceRole.entities.Client.filter({ id: review.client_id })
        : Promise.resolve([]),
      review.project_id 
        ? base44.asServiceRole.entities.Project.filter({ id: review.project_id })
        : Promise.resolve([])
    ]);

    const client = clients[0] || null;
    const project = projects[0] || null;

    return Response.json({
      review: {
        id: review.id,
        title: review.title,
        description: review.description,
        file_urls: review.file_urls,
        status: review.status,
        due_date: review.due_date,
        comments: review.comments || [],
        version: review.version || 1,
        created_date: review.created_date,
      },
      client: client ? {
        first_name: client.first_name,
        last_name: client.last_name,
        company: client.company,
      } : null,
      project: project ? {
        name: project.name,
      } : null,
    });
  } catch (error) {
    console.error('getReviewByShareToken error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});