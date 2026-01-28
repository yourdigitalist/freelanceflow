import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Initializing user:', user.email);

    // Check existing subscription
    const existingSubscription = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
    });

    // Check existing statuses
    const existingStatuses = await base44.asServiceRole.entities.TaskStatus.filter({
      created_by: user.email,
    });
    
    const globalStatuses = existingStatuses.filter(s => !s.project_id);
    console.log('Found global statuses:', globalStatuses.length);

    // Create subscription if missing
    let subscription = existingSubscription[0];
    if (!subscription) {
      subscription = await base44.asServiceRole.entities.Subscription.create({
        user_id: user.id,
        plan: 'free',
        status: 'active',
        billing_email: user.email,
        billing_cycle_start: new Date().toISOString().split('T')[0],
        billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
      console.log('Created subscription');
    }

    // ALWAYS create statuses if less than 4 global ones exist
    if (globalStatuses.length < 4) {
      console.log('Creating default statuses...');
      
      const defaultStatuses = [
        { name: 'To Do', key: 'todo', color: '#94a3b8', order: 0, is_done: false },
        { name: 'In Progress', key: 'in_progress', color: '#3b82f6', order: 1, is_done: false },
        { name: 'Review', key: 'review', color: '#f59e0b', order: 2, is_done: false },
        { name: 'Completed', key: 'completed', color: '#10b981', order: 3, is_done: true },
      ];

      const createdStatuses = await Promise.all(
  defaultStatuses.map(status =>
    base44.entities.TaskStatus.create({  
            ...status,
            created_by: user.email,
            project_id: null,
          })
        )
      );

      console.log('✅ Created statuses:', createdStatuses.length);
      
      return Response.json({
        success: true,
        subscription,
        statusesCreated: createdStatuses.length,
        message: `Created ${createdStatuses.length} default statuses`,
      });
    }

    // Update onboarding if needed
    if (!user.onboarding_completed) {
      await base44.auth.updateMe({
        onboarding_step: 'company_info',
        onboarding_completed: false,
      });
    }

    return Response.json({
      success: true,
      subscription,
      statusCount: globalStatuses.length,
      message: 'User already initialized',
    });
  } catch (error) {
    console.error('❌ initializeUser error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});