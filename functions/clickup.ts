import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await req.json();
    const apiKey = Deno.env.get('CLICKUP_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'ClickUp API key not configured' }, { status: 500 });
    }

    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    };

    let response;

    switch (action) {
      case 'getWorkspaces': {
        response = await fetch(`${CLICKUP_API_BASE}/team`, { headers });
        break;
      }

      case 'getSpaces': {
        const { teamId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/space`, { headers });
        break;
      }

      case 'getFolders': {
        const { spaceId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/space/${spaceId}/folder`, { headers });
        break;
      }

      case 'getLists': {
        const { folderId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/folder/${folderId}/list`, { headers });
        break;
      }

      case 'getListsInSpace': {
        const { spaceId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/space/${spaceId}/list`, { headers });
        break;
      }

      case 'getTasks': {
        const { listId, archived = false } = params;
        response = await fetch(
          `${CLICKUP_API_BASE}/list/${listId}/task?archived=${archived}`,
          { headers }
        );
        break;
      }

      case 'getTask': {
        const { taskId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, { headers });
        break;
      }

      case 'createTask': {
        const { listId, name, description, status, priority, assignees, dueDate, tags } = params;
        
        const taskData = {
          name,
          description,
          status,
          priority,
          assignees: assignees || [],
          due_date: dueDate,
          tags: tags || []
        };

        response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
          method: 'POST',
          headers,
          body: JSON.stringify(taskData)
        });
        break;
      }

      case 'updateTask': {
        const { taskId, name, description, status, priority, assignees, dueDate } = params;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (assignees) updateData.assignees = { add: assignees };
        if (dueDate) updateData.due_date = dueDate;

        response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        });
        break;
      }

      case 'deleteTask': {
        const { taskId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
          method: 'DELETE',
          headers
        });
        break;
      }

      case 'getTaskComments': {
        const { taskId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}/comment`, { headers });
        break;
      }

      case 'createComment': {
        const { taskId, commentText } = params;
        response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}/comment`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ comment_text: commentText })
        });
        break;
      }

      case 'getTimeEntries': {
        const { teamId, startDate, endDate } = params;
        const url = new URL(`${CLICKUP_API_BASE}/team/${teamId}/time_entries`);
        if (startDate) url.searchParams.append('start_date', startDate);
        if (endDate) url.searchParams.append('end_date', endDate);
        
        response = await fetch(url.toString(), { headers });
        break;
      }

      case 'searchTasks': {
        const { teamId, query } = params;
        response = await fetch(
          `${CLICKUP_API_BASE}/team/${teamId}/task?search=${encodeURIComponent(query)}`,
          { headers }
        );
        break;
      }

      case 'createWebhook': {
        const { listId, endpoint, events } = params;
        response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/webhook`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint,
            events: events || ['taskCreated', 'taskUpdated', 'taskDeleted', 'taskCommentPosted']
          })
        });
        break;
      }

      case 'listWebhooks': {
        const { teamId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/webhook`, { headers });
        break;
      }

      case 'deleteWebhook': {
        const { webhookId } = params;
        response = await fetch(`${CLICKUP_API_BASE}/webhook/${webhookId}`, {
          method: 'DELETE',
          headers
        });
        break;
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `ClickUp API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});