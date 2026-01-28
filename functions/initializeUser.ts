import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a subscription
    const existingSubscription = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
    });

    if (existingSubscription.length > 0) {
      return Response.json({
        success: true,
        message: 'User already initialized',
      });
    }

    // Create free subscription for new user
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      user_id: user.id,
      plan: 'free',
      status: 'active',
      billing_email: user.email,
      billing_cycle_start: new Date().toISOString().split('T')[0],
      billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    });

    // Create default task statuses for new user
    const defaultStatuses = [
      { name: 'To Do', key: 'todo', color: '#94a3b8', order: 0, is_done: false },
      { name: 'In Progress', key: 'in_progress', color: '#3b82f6', order: 1, is_done: false },
      { name: 'Review', key: 'review', color: '#f59e0b', order: 2, is_done: false },
      { name: 'Completed', key: 'completed', color: '#10b981', order: 3, is_done: true },
    ];

    await Promise.all(
      defaultStatuses.map(status =>
        base44.asServiceRole.entities.TaskStatus.create({
          ...status,
          created_by: user.email,
        })
      )
    );

    // Update user with onboarding step
    await base44.auth.updateMe({
      onboarding_step: 'company_info',
      onboarding_completed: false,
    });

    return Response.json({
      success: true,
      subscription,
      message: 'User initialized successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});