import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId, ventureId, direction = 'both' } = await req.json();

    if (!listId || !ventureId) {
      return Response.json({ error: 'listId and ventureId required' }, { status: 400 });
    }

    const results = {
      clickupToVenture: { created: 0, updated: 0 },
      ventureToClickup: { created: 0, updated: 0 }
    };

    // Sync ClickUp -> VentureTask
    if (direction === 'both' || direction === 'clickup_to_venture') {
      const clickupTasksResponse = await base44.functions.invoke('clickup', {
        action: 'getTasks',
        listId
      });

      const clickupTasks = clickupTasksResponse.data.tasks || [];
      const existingVentureTasks = await base44.asServiceRole.entities.VentureTask.filter({
        venture_id: ventureId
      });

      for (const clickupTask of clickupTasks) {
        const existingTask = existingVentureTasks.find(vt => 
          vt.related_entity === 'clickup' && vt.related_entity_id === clickupTask.id
        );

        const taskData = {
          venture_id: ventureId,
          title: clickupTask.name,
          description: clickupTask.description || '',
          status: clickupTask.status?.status?.toLowerCase().includes('complete') ? 'completed' : 
                  clickupTask.status?.status?.toLowerCase().includes('progress') ? 'in_progress' : 'todo',
          priority: clickupTask.priority?.priority === 1 ? 'urgent' :
                    clickupTask.priority?.priority === 2 ? 'high' :
                    clickupTask.priority?.priority === 3 ? 'medium' : 'low',
          assigned_to: clickupTask.assignees?.[0]?.email || user.email,
          due_date: clickupTask.due_date ? new Date(parseInt(clickupTask.due_date)).toISOString().split('T')[0] : null,
          related_entity: 'clickup',
          related_entity_id: clickupTask.id,
          clickup_data: {
            assignees: clickupTask.assignees || [],
            custom_fields: clickupTask.custom_fields || [],
            tags: clickupTask.tags || [],
            url: clickupTask.url,
            time_estimate: clickupTask.time_estimate,
            time_spent: clickupTask.time_spent,
            status_text: clickupTask.status?.status
          }
        };

        if (existingTask) {
          await base44.asServiceRole.entities.VentureTask.update(existingTask.id, taskData);
          results.clickupToVenture.updated++;
        } else {
          await base44.asServiceRole.entities.VentureTask.create(taskData);
          results.clickupToVenture.created++;
        }
      }
    }

    // Sync VentureTask -> ClickUp
    if (direction === 'both' || direction === 'venture_to_clickup') {
      const ventureTasks = await base44.asServiceRole.entities.VentureTask.filter({
        venture_id: ventureId
      });

      for (const ventureTask of ventureTasks) {
        if (ventureTask.related_entity === 'clickup' && ventureTask.related_entity_id) {
          // Update existing ClickUp task
          try {
            const statusMap = {
              'todo': 'to do',
              'in_progress': 'in progress',
              'completed': 'complete',
              'review': 'review'
            };

            await base44.asServiceRole.functions.invoke('clickup', {
              action: 'updateTask',
              taskId: ventureTask.related_entity_id,
              status: statusMap[ventureTask.status] || ventureTask.status,
              priority: ventureTask.priority === 'urgent' ? 1 :
                        ventureTask.priority === 'high' ? 2 :
                        ventureTask.priority === 'medium' ? 3 : 4
            });
            results.ventureToClickup.updated++;
          } catch (error) {
            console.error(`Failed to update ClickUp task ${ventureTask.related_entity_id}:`, error);
          }
        } else if (!ventureTask.related_entity) {
          // Create new ClickUp task for VentureTask that doesn't have a ClickUp counterpart
          try {
            const response = await base44.asServiceRole.functions.invoke('clickup', {
              action: 'createTask',
              listId,
              name: ventureTask.title,
              description: ventureTask.description,
              status: ventureTask.status === 'completed' ? 'complete' : 
                      ventureTask.status === 'in_progress' ? 'in progress' : 'to do',
              priority: ventureTask.priority === 'urgent' ? 1 :
                        ventureTask.priority === 'high' ? 2 :
                        ventureTask.priority === 'medium' ? 3 : 4
            });

            // Update VentureTask with ClickUp ID
            await base44.asServiceRole.entities.VentureTask.update(ventureTask.id, {
              related_entity: 'clickup',
              related_entity_id: response.data.id
            });
            results.ventureToClickup.created++;
          } catch (error) {
            console.error(`Failed to create ClickUp task for ${ventureTask.id}:`, error);
          }
        }
      }
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});