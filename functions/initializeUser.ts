import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.id || !user.email) {
      console.error('initializeUser error: User or user ID/email not found', user);
      return Response.json({ error: 'Unauthorized or invalid user data' }, { status: 401 });
    }

    console.log('Initializing user:', user.email);

    // Check if user already has a subscription
    let existingSubscription = [];
    let globalStatuses = [];
    
    try {
      console.log('Fetching subscriptions...');
      const allSubscriptions = await base44.asServiceRole.entities.Subscription.list();
      console.log('Subscriptions result type:', typeof allSubscriptions);
      existingSubscription = Array.isArray(allSubscriptions) 
        ? allSubscriptions.filter(s => s.user_id === user.id)
        : [];
      console.log('Found subscriptions:', existingSubscription.length);
    } catch (e) {
      console.error('Error fetching subscriptions:', e.message);
      existingSubscription = [];
    }

    // Check if user already has DEFAULT statuses
    try {
      console.log('Fetching statuses...');
      const allStatuses = await base44.asServiceRole.entities.TaskStatus.list();
      console.log('Statuses result type:', typeof allStatuses);
      const existingStatuses = Array.isArray(allStatuses)
        ? allStatuses.filter(s => s.created_by === user.email)
        : [];
      
      globalStatuses = existingStatuses.filter(s => !s.project_id);
      console.log('Found global statuses:', globalStatuses.length);
    } catch (e) {
      console.error('Error fetching statuses:', e.message);
      globalStatuses = [];
    }

    // Early return if both exist
    if (existingSubscription.length > 0 && globalStatuses.length >= 4) {
      console.log('User already initialized');
      return Response.json({
        success: true,
        message: 'User already initialized',
        subscription: existingSubscription[0],
        statusesCount: globalStatuses.length,
      });
    }

    // Create subscription if needed
    let subscription = existingSubscription[0];
    if (!subscription) {
      console.log('Creating subscription...');
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
      console.log('Subscription created');
    }

    // Create default statuses if needed
    if (globalStatuses.length === 0) {
      console.log('Creating default statuses...');
      const defaultStatuses = [
        { name: 'To Do', key: 'todo', color: '#94a3b8', order: 0, is_done: false },
        { name: 'In Progress', key: 'in_progress', color: '#3b82f6', order: 1, is_done: false },
        { name: 'Review', key: 'review', color: '#f59e0b', order: 2, is_done: false },
        { name: 'Completed', key: 'completed', color: '#10b981', order: 3, is_done: true },
      ];

      const createdStatuses = await Promise.all(
        defaultStatuses.map(status =>
          base44.asServiceRole.entities.TaskStatus.create({
            ...status,
            created_by: user.email,
            project_id: null,
          })
        )
      );

      console.log('Created default statuses:', createdStatuses.length);
    }

    // Update onboarding if needed
    if (!user.onboarding_completed) {
      console.log('Updating onboarding...');
      await base44.auth.updateMe({
        onboarding_step: 'company_info',
        onboarding_completed: false,
      });
    }

    console.log('User initialized successfully');
    return Response.json({
      success: true,
      subscription,
      statusesCreated: globalStatuses.length === 0,
      statusesCount: globalStatuses.length === 0 ? 4 : globalStatuses.length,
      message: 'User initialized successfully',
    });
  } catch (error) {
    console.error('initializeUser error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});