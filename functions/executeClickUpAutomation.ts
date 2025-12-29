import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task, eventType, listId } = await req.json();

    // Fetch active automations for this list
    const automations = await base44.asServiceRole.entities.ClickUpAutomation.filter({
      list_id: listId,
      active: true
    });

    const executedAutomations = [];

    for (const automation of automations) {
      // Check if trigger matches
      let shouldExecute = false;

      switch (automation.trigger_type) {
        case 'task_created':
          shouldExecute = eventType === 'task_created';
          break;
        case 'task_completed':
          shouldExecute = eventType === 'task_status_changed' && 
            task.status?.status?.toLowerCase().includes('complete');
          break;
        case 'task_status_changed':
          shouldExecute = eventType === 'task_status_changed';
          if (automation.trigger_conditions?.target_status) {
            shouldExecute = shouldExecute && 
              task.status?.status?.toLowerCase() === automation.trigger_conditions.target_status.toLowerCase();
          }
          break;
        case 'task_assigned':
          shouldExecute = eventType === 'task_assigned';
          break;
        case 'task_priority_changed':
          shouldExecute = eventType === 'task_priority_changed';
          break;
      }

      if (!shouldExecute) continue;

      // Execute action
      try {
        switch (automation.action_type) {
          case 'create_task': {
            const { task_name, task_description, target_list_id, status, priority } = automation.action_config;
            
            // Replace placeholders
            const taskName = task_name
              ?.replace('{{task_name}}', task.name)
              ?.replace('{{task_id}}', task.id) || 'Follow-up Task';
            
            const taskDesc = task_description
              ?.replace('{{task_name}}', task.name)
              ?.replace('{{task_url}}', task.url) || '';

            await base44.asServiceRole.functions.invoke('clickup', {
              action: 'createTask',
              listId: target_list_id || listId,
              name: taskName,
              description: taskDesc,
              status: status || undefined,
              priority: priority || 3
            });
            break;
          }

          case 'send_notification': {
            const { user_email, title, message } = automation.action_config;
            
            const notifTitle = title
              ?.replace('{{task_name}}', task.name) || 'Task Update';
            
            const notifMessage = message
              ?.replace('{{task_name}}', task.name)
              ?.replace('{{task_status}}', task.status?.status || 'N/A')
              ?.replace('{{task_url}}', task.url) || 'A task was updated';

            await base44.asServiceRole.entities.Notification.create({
              user_email: user_email || user.email,
              type: 'task_assigned',
              title: notifTitle,
              message: notifMessage,
              action_url: task.url
            });
            break;
          }

          case 'send_email': {
            const { recipient_email, subject, body } = automation.action_config;
            
            const emailSubject = subject
              ?.replace('{{task_name}}', task.name) || 'Task Update';
            
            const emailBody = body
              ?.replace('{{task_name}}', task.name)
              ?.replace('{{task_status}}', task.status?.status || 'N/A')
              ?.replace('{{task_url}}', task.url) || 'A task was updated';

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: recipient_email || user.email,
              subject: emailSubject,
              body: emailBody
            });
            break;
          }

          case 'update_task': {
            const { status, priority } = automation.action_config;
            
            await base44.asServiceRole.functions.invoke('clickup', {
              action: 'updateTask',
              taskId: task.id,
              status: status || undefined,
              priority: priority || undefined
            });
            break;
          }

          case 'assign_task': {
            const { user_id } = automation.action_config;
            
            if (user_id) {
              await base44.asServiceRole.functions.invoke('clickup', {
                action: 'updateTask',
                taskId: task.id,
                assignees: [user_id]
              });
            }
            break;
          }
        }

        // Update execution count
        await base44.asServiceRole.entities.ClickUpAutomation.update(automation.id, {
          execution_count: (automation.execution_count || 0) + 1,
          last_executed: new Date().toISOString()
        });

        executedAutomations.push({
          automation_id: automation.id,
          automation_name: automation.name,
          success: true
        });

      } catch (error) {
        console.error(`Failed to execute automation ${automation.id}:`, error);
        executedAutomations.push({
          automation_id: automation.id,
          automation_name: automation.name,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      executed: executedAutomations.length,
      automations: executedAutomations
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});