import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate webhook signature
    const signature = req.headers.get('x-signature');
    const webhookSecret = Deno.env.get('CLICKUP_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      // TODO: Implement signature validation if needed
      // const body = await req.text();
      // const expectedSignature = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body + webhookSecret));
    }

    const payload = await req.json();
    const { event, task_id, history_items, webhook_id } = payload;

    console.log('ClickUp Webhook received:', event, task_id);

    // Find VentureTask linked to this ClickUp task
    const ventureTasks = await base44.asServiceRole.entities.VentureTask.filter({
      related_entity: 'clickup',
      related_entity_id: task_id
    });

    if (ventureTasks.length === 0) {
      console.log('No VentureTask found for ClickUp task:', task_id);
      return Response.json({ message: 'No linked task found' });
    }

    const ventureTask = ventureTasks[0];

    // Handle different webhook events
    switch (event) {
      case 'taskUpdated':
        // Fetch latest task data from ClickUp
        const clickupResponse = await base44.asServiceRole.functions.invoke('clickup', {
          action: 'getTask',
          taskId: task_id
        });
        
        const clickupTask = clickupResponse.data;
        
        // Update VentureTask with latest data
        await base44.asServiceRole.entities.VentureTask.update(ventureTask.id, {
          title: clickupTask.name,
          description: clickupTask.description || '',
          status: clickupTask.status?.status?.toLowerCase().includes('complete') ? 'completed' : 
                  clickupTask.status?.status?.toLowerCase().includes('progress') ? 'in_progress' : 'todo',
          priority: clickupTask.priority?.priority === 1 ? 'urgent' :
                    clickupTask.priority?.priority === 2 ? 'high' :
                    clickupTask.priority?.priority === 3 ? 'medium' : 'low',
          due_date: clickupTask.due_date ? new Date(parseInt(clickupTask.due_date)).toISOString().split('T')[0] : null,
          clickup_data: {
            assignees: clickupTask.assignees || [],
            custom_fields: clickupTask.custom_fields || [],
            tags: clickupTask.tags || [],
            url: clickupTask.url,
            time_estimate: clickupTask.time_estimate,
            time_spent: clickupTask.time_spent
          }
        });

        // Trigger automation
        try {
          await base44.asServiceRole.functions.invoke('executeClickUpAutomation', {
            task: clickupTask,
            eventType: 'task_status_changed',
            listId: clickupTask.list?.id
          });
        } catch (error) {
          console.error('Automation execution failed:', error);
        }

        // Create notification
        if (ventureTask.assigned_to) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: ventureTask.assigned_to,
            type: 'task_assigned',
            title: 'Tarefa atualizada no ClickUp',
            message: `"${clickupTask.name}" foi atualizada`,
            action_url: clickupTask.url
          });
        }
        break;

      case 'taskCreated':
        // Fetch new task data
        const newTaskResponse = await base44.asServiceRole.functions.invoke('clickup', {
          action: 'getTask',
          taskId: task_id
        });
        
        const newTask = newTaskResponse.data;
        
        // Create VentureTask if it doesn't exist
        // Note: This might be triggered when we create the task, so check first
        const existingTasks = await base44.asServiceRole.entities.VentureTask.filter({
          related_entity: 'clickup',
          related_entity_id: task_id
        });

        if (existingTasks.length === 0 && newTask.list?.id) {
          // Find venture associated with this list
          const projects = await base44.asServiceRole.entities.VentureProject.filter({
            clickup_list_ids: { $in: [newTask.list.id] }
          });

          if (projects.length > 0) {
            await base44.asServiceRole.entities.VentureTask.create({
              venture_id: projects[0].venture_id,
              title: newTask.name,
              description: newTask.description || '',
              status: 'todo',
              priority: 'medium',
              assigned_to: newTask.assignees?.[0]?.email || '',
              related_entity: 'clickup',
              related_entity_id: task_id,
              clickup_data: {
                assignees: newTask.assignees || [],
                custom_fields: newTask.custom_fields || [],
                tags: newTask.tags || [],
                url: newTask.url
              }
            });
          }
        }
        break;

      case 'taskDeleted':
        // Mark task as cancelled or delete it
        if (ventureTask) {
          await base44.asServiceRole.entities.VentureTask.update(ventureTask.id, {
            status: 'cancelled'
          });
        }
        break;

      case 'taskCommentPosted':
        // Create notification about new comment
        if (ventureTask.assigned_to) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: ventureTask.assigned_to,
            type: 'task_assigned',
            title: 'Novo comentário no ClickUp',
            message: `Novo comentário na tarefa "${ventureTask.title}"`,
            metadata: payload
          });
        }
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return Response.json({ success: true, processed: event });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});