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
        case 'task_due_date_approaching':
          if (task.due_date && automation.trigger_conditions?.days_before) {
            const dueDate = new Date(parseInt(task.due_date));
            const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
            shouldExecute = daysUntilDue === automation.trigger_conditions.days_before;
          }
          break;
        case 'comment_added':
          shouldExecute = eventType === 'comment_added';
          break;
        case 'custom_field_changed':
          shouldExecute = eventType === 'custom_field_changed';
          if (automation.trigger_conditions?.field_id) {
            shouldExecute = shouldExecute && task.changed_field_id === automation.trigger_conditions.field_id;
          }
          break;
      }

      if (!shouldExecute) continue;

      // Evaluate conditional logic if enabled
      if (automation.conditional_logic?.enabled) {
        let conditionsMet = true;
        const conditions = automation.conditional_logic.conditions || [];
        
        for (const condition of conditions) {
          const fieldValue = task[condition.field];
          const conditionValue = condition.value;
          
          switch (condition.operator) {
            case 'equals':
              conditionsMet = conditionsMet && fieldValue === conditionValue;
              break;
            case 'not_equals':
              conditionsMet = conditionsMet && fieldValue !== conditionValue;
              break;
            case 'contains':
              conditionsMet = conditionsMet && String(fieldValue).includes(conditionValue);
              break;
            case 'greater_than':
              conditionsMet = conditionsMet && Number(fieldValue) > Number(conditionValue);
              break;
            case 'less_than':
              conditionsMet = conditionsMet && Number(fieldValue) < Number(conditionValue);
              break;
          }
        }

        // Use then or else action based on conditions
        if (conditionsMet && automation.conditional_logic.then_action) {
          automation.action_type = automation.conditional_logic.then_action.type;
          automation.action_config = automation.conditional_logic.then_action.config;
        } else if (!conditionsMet && automation.conditional_logic.else_action) {
          automation.action_type = automation.conditional_logic.else_action.type;
          automation.action_config = automation.conditional_logic.else_action.config;
        } else {
          continue;
        }
      }

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

          case 'assign_by_role': {
            const { role } = automation.action_config;
            
            if (role) {
              // Find users with this role
              const users = await base44.asServiceRole.entities.User.filter({ role });
              if (users.length > 0) {
                // Assign to first available user or use round-robin logic
                const assignee = users[0];
                await base44.asServiceRole.functions.invoke('clickup', {
                  action: 'updateTask',
                  taskId: task.id,
                  assignees: [assignee.email]
                });
              }
            }
            break;
          }

          case 'update_custom_field': {
            const { field_id, field_value } = automation.action_config;
            
            if (field_id) {
              await base44.asServiceRole.functions.invoke('clickup', {
                action: 'updateTask',
                taskId: task.id,
                custom_fields: [{ id: field_id, value: field_value }]
              });
            }
            break;
          }

          case 'move_to_list': {
            const { target_list_id } = automation.action_config;
            
            if (target_list_id) {
              await base44.asServiceRole.functions.invoke('clickup', {
                action: 'updateTask',
                taskId: task.id,
                list: target_list_id
              });
            }
            break;
          }

          case 'create_subtask': {
            const { subtask_name, subtask_description } = automation.action_config;
            
            await base44.asServiceRole.functions.invoke('clickup', {
              action: 'createTask',
              listId: listId,
              name: subtask_name?.replace('{{task_name}}', task.name) || 'Subtask',
              description: subtask_description?.replace('{{task_name}}', task.name) || '',
              parent: task.id
            });
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